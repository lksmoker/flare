from __future__ import annotations

import argparse
import json
import os
import subprocess
import sys
import time
from dataclasses import dataclass
from pathlib import Path
from typing import Any
from urllib import error, request

try:
    import psutil
except ImportError:  # pragma: no cover - exercised in test environments without psutil
    psutil = None

REPO_ROOT = Path(__file__).resolve().parents[1]
SCRIPTS_DIR = REPO_ROOT / "scripts"
LOG_DIR = REPO_ROOT / "logs"
ENV_FILE = Path(r"C:\Users\lukes\.toolbox-secrets\dev-toolbox-starter.env")
PYTHON_EXE = Path(r"C:\Users\lukes\AppData\Local\Programs\Python\Python312\python.exe")
POWERSHELL_EXE = Path(r"C:\Windows\System32\WindowsPowerShell\v1.0\powershell.exe")
NPM_CMD = Path(r"C:\Program Files\nodejs\npm.cmd")
NODE_EXE = Path(r"C:\Program Files\nodejs\node.exe")

DEFAULT_TIMEOUT_SECONDS = 180
DEFAULT_POLL_INTERVAL_SECONDS = 1.0


class ControlRestartError(RuntimeError):
    pass


@dataclass(frozen=True)
class Component:
    service_id: str
    name: str
    port: int
    health_url: str
    script_path: Path
    expected_process_name: str
    command_markers: tuple[str, ...]
    log_path: Path


BACKEND_COMPONENT = Component(
    service_id="flare-backend",
    name="Flare backend",
    port=9001,
    health_url="http://127.0.0.1:9001/api/health",
    script_path=SCRIPTS_DIR / "start-flare-support-backend.ps1",
    expected_process_name="python.exe",
    command_markers=("backend.app.http.server", str(REPO_ROOT).lower()),
    log_path=LOG_DIR / "flare_backend.log",
)
FRONTEND_COMPONENT = Component(
    service_id="flare-frontend",
    name="Flare frontend",
    port=8081,
    health_url="http://127.0.0.1:8081/",
    script_path=SCRIPTS_DIR / "start-flare-dev-child.ps1",
    expected_process_name="node.exe",
    command_markers=("expo", str(REPO_ROOT / "frontend").lower()),
    log_path=LOG_DIR / "flare_frontend.log",
)
COMPONENTS = (BACKEND_COMPONENT, FRONTEND_COMPONENT)


def _normalize_cmdline(value: Any) -> list[str]:
    if value is None:
        return []
    if isinstance(value, (list, tuple)):
        return [str(item) for item in value]
    return [str(value)]


def _iter_processes() -> list[psutil.Process]:
    if psutil is None:
        raise ControlRestartError("psutil is required for control restart process inspection.")
    return list(psutil.process_iter(["pid", "ppid", "name", "cmdline"]))


def _listener_processes(port: int, processes: list[psutil.Process]) -> list[psutil.Process]:
    listeners: list[psutil.Process] = []
    for proc in processes:
        try:
            for connection in proc.connections(kind="inet"):
                if connection.status == psutil.CONN_LISTEN and connection.laddr and connection.laddr.port == port:
                    listeners.append(proc)
                    break
        except (psutil.Error, OSError):
            continue
    return listeners


def _command_matches(process: psutil.Process, component: Component) -> bool:
    cmdline = " ".join(_normalize_cmdline(process.info.get("cmdline"))).lower()
    return all(marker in cmdline for marker in component.command_markers)


def ensure_expected_ownership(
    *,
    component: Component,
    processes: list[psutil.Process] | None = None,
) -> dict[str, Any]:
    current_processes = _iter_processes() if processes is None else processes
    listeners = _listener_processes(component.port, current_processes)
    if not listeners:
        return {"running": False, "listeners": []}
    for listener in listeners:
        name = str(listener.info.get("name") or "").lower()
        if name != component.expected_process_name:
            raise ControlRestartError(
                f"{component.name} port {component.port} is owned by unexpected process {listener.info.get('name')}."
            )
        if not _command_matches(listener, component):
            raise ControlRestartError(
                f"{component.name} port {component.port} is owned by a process with unexpected executable identity."
            )
    return {"running": True, "listeners": listeners}


def stop_component_tree(component: Component) -> str:
    ownership = ensure_expected_ownership(component=component)
    if not ownership["running"]:
        return f"{component.name}: no existing process tree detected."
    listeners: list[psutil.Process] = ownership["listeners"]
    for proc in listeners:
        try:
            for child in reversed(proc.children(recursive=True)):
                child.kill()
            proc.kill()
        except psutil.NoSuchProcess:
            continue
        except (psutil.Error, OSError) as exc:
            raise ControlRestartError(f"Failed to stop {component.name} process tree: {exc}") from exc
    deadline = time.monotonic() + 15
    while time.monotonic() < deadline:
        if not ensure_expected_ownership(component=component)["running"]:
            return f"{component.name}: stopped {len(listeners)} listener process tree(s) on port {component.port}."
        time.sleep(0.25)
    raise ControlRestartError(f"{component.name} process tree did not stop within the timeout.")


def _frontend_env() -> dict[str, str]:
    env = os.environ.copy()
    env["EXPO_NO_TELEMETRY"] = "1"
    return env


def launch_backend() -> subprocess.Popen[str]:
    if not PYTHON_EXE.exists():
        raise ControlRestartError(f"Required Python executable not found: {PYTHON_EXE}")
    if not BACKEND_COMPONENT.script_path.exists():
        raise ControlRestartError(f"Required backend launcher script not found: {BACKEND_COMPONENT.script_path}")
    LOG_DIR.mkdir(parents=True, exist_ok=True)
    handle = BACKEND_COMPONENT.log_path.open("a", encoding="utf-8")
    argv = [
        str(POWERSHELL_EXE),
        "-NoProfile",
        "-ExecutionPolicy",
        "Bypass",
        "-File",
        str(BACKEND_COMPONENT.script_path),
        "-RepoRoot",
        str(REPO_ROOT),
        "-EnvFile",
        str(ENV_FILE),
        "-HostName",
        "0.0.0.0",
        "-Port",
        "9001",
        "-PythonExe",
        str(PYTHON_EXE),
        "-NonInteractive",
    ]
    return subprocess.Popen(
        argv,
        cwd=str(REPO_ROOT),
        stdin=subprocess.DEVNULL,
        stdout=handle,
        stderr=handle,
        text=True,
        close_fds=False,
        creationflags=getattr(subprocess, "CREATE_NO_WINDOW", 0),
    )


def launch_frontend() -> subprocess.Popen[str]:
    if not NPM_CMD.exists():
        raise ControlRestartError(f"Required npm executable not found: {NPM_CMD}")
    if not NODE_EXE.exists():
        raise ControlRestartError(f"Required Node executable not found: {NODE_EXE}")
    if not FRONTEND_COMPONENT.script_path.exists():
        raise ControlRestartError(f"Required frontend launcher script not found: {FRONTEND_COMPONENT.script_path}")
    LOG_DIR.mkdir(parents=True, exist_ok=True)
    handle = FRONTEND_COMPONENT.log_path.open("a", encoding="utf-8")
    argv = [
        str(POWERSHELL_EXE),
        "-NoProfile",
        "-ExecutionPolicy",
        "Bypass",
        "-File",
        str(FRONTEND_COMPONENT.script_path),
        "-RepoRoot",
        str(REPO_ROOT),
        "-EnvFile",
        str(ENV_FILE),
        "-Port",
        "8081",
        "-NpmCmd",
        str(NPM_CMD),
        "-NodeExe",
        str(NODE_EXE),
        "-NonInteractive",
        "-SkipPortCleanup",
    ]
    return subprocess.Popen(
        argv,
        cwd=str(REPO_ROOT),
        env=_frontend_env(),
        stdin=subprocess.DEVNULL,
        stdout=handle,
        stderr=handle,
        text=True,
        close_fds=False,
        creationflags=getattr(subprocess, "CREATE_NO_WINDOW", 0),
    )


def _health_ok(component: Component, payload: bytes, status_code: int) -> bool:
    if status_code != 200:
        return False
    if component.service_id == "flare-backend":
        try:
            decoded = json.loads(payload.decode("utf-8"))
        except (ValueError, UnicodeDecodeError):
            return False
        return decoded.get("status") == "ok"
    return True


def wait_for_component_ready(
    component: Component,
    *,
    process: subprocess.Popen[str],
    timeout_seconds: int,
    poll_interval_seconds: float,
) -> None:
    deadline = time.monotonic() + max(1, timeout_seconds)
    while time.monotonic() < deadline:
        exit_code = process.poll()
        if exit_code is not None:
            raise ControlRestartError(f"{component.name} launcher exited early with code {exit_code}.")
        ownership = ensure_expected_ownership(component=component)
        if ownership["running"]:
            try:
                req = request.Request(component.health_url, method="GET")
                with request.urlopen(req, timeout=5) as response:
                    payload = response.read()
                    if _health_ok(component, payload, response.status):
                        return
            except (error.URLError, TimeoutError, OSError):
                pass
        time.sleep(max(0.1, poll_interval_seconds))
    raise ControlRestartError(f"{component.name} did not satisfy ownership and health verification before timeout.")


def control_restart_stack(*, timeout_seconds: int, poll_interval_seconds: float) -> int:
    stop_summaries = [stop_component_tree(component) for component in COMPONENTS]
    try:
        backend_process = launch_backend()
        frontend_process = launch_frontend()
        wait_for_component_ready(
            BACKEND_COMPONENT,
            process=backend_process,
            timeout_seconds=timeout_seconds,
            poll_interval_seconds=poll_interval_seconds,
        )
        wait_for_component_ready(
            FRONTEND_COMPONENT,
            process=frontend_process,
            timeout_seconds=timeout_seconds,
            poll_interval_seconds=poll_interval_seconds,
        )
    except ControlRestartError as exc:
        sys.stderr.write(str(exc) + "\n")
        return 1

    payload = {
        "status": "ok",
        "stop_summaries": stop_summaries,
        "components": [
            {"service_id": BACKEND_COMPONENT.service_id, "launcher_pid": backend_process.pid, "log_path": str(BACKEND_COMPONENT.log_path)},
            {"service_id": FRONTEND_COMPONENT.service_id, "launcher_pid": frontend_process.pid, "log_path": str(FRONTEND_COMPONENT.log_path)},
        ],
    }
    sys.stdout.write(json.dumps(payload, separators=(",", ":")) + "\n")
    return 0


def build_parser() -> argparse.ArgumentParser:
    parser = argparse.ArgumentParser(description="Noninteractive Flare stack restart helper.")
    parser.add_argument("--timeout-seconds", type=int, default=DEFAULT_TIMEOUT_SECONDS)
    parser.add_argument("--poll-interval-seconds", type=float, default=DEFAULT_POLL_INTERVAL_SECONDS)
    return parser


def main(argv: list[str] | None = None) -> int:
    args = build_parser().parse_args(argv)
    return control_restart_stack(timeout_seconds=args.timeout_seconds, poll_interval_seconds=args.poll_interval_seconds)


if __name__ == "__main__":
    raise SystemExit(main())
