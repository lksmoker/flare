from __future__ import annotations

import importlib.util
import sys
import unittest
from pathlib import Path


ROOT = Path(__file__).resolve().parents[2]
SCRIPTS_DIR = ROOT / "scripts"


def _load_helper():
    helper_path = SCRIPTS_DIR / "control_restart_flare_stack.py"
    spec = importlib.util.spec_from_file_location("flare_control_restart_helper", helper_path)
    module = importlib.util.module_from_spec(spec)
    assert spec is not None and spec.loader is not None
    sys.modules[spec.name] = module
    spec.loader.exec_module(module)
    return module


class FlareControlRestartContractTests(unittest.TestCase):
    def test_launch_flare_batch_routes_control_restart_to_helper(self) -> None:
        script = (ROOT / "launch_flare.bat").read_text(encoding="utf-8")
        self.assertIn('if /i "%~1"=="control-restart" goto :control_restart', script)
        self.assertIn('scripts\\control_restart_flare_stack.py', script)

    def test_frontend_launcher_bypasses_read_host_when_noninteractive(self) -> None:
        script = (SCRIPTS_DIR / "start-flare-dev-child.ps1").read_text(encoding="utf-8")
        self.assertIn("[switch]$NonInteractive", script)
        self.assertIn("if (-not $NonInteractive) {", script)
        self.assertIn('Read-Host "Press Enter to close"', script)

    def test_backend_launcher_uses_explicit_python_executable(self) -> None:
        script = (SCRIPTS_DIR / "start-flare-support-backend.ps1").read_text(encoding="utf-8")
        self.assertIn('[string]$PythonExe', script)
        self.assertIn('& $PythonExe -m backend.app.http.server', script)

    def test_helper_requires_explicit_python_npm_and_node_paths(self) -> None:
        helper = _load_helper()
        self.assertTrue(str(helper.PYTHON_EXE).lower().endswith("python.exe"))
        self.assertTrue(str(helper.NPM_CMD).lower().endswith("npm.cmd"))
        self.assertTrue(str(helper.NODE_EXE).lower().endswith("node.exe"))

    def test_helper_checks_backend_and_frontend_health_contracts(self) -> None:
        helper = _load_helper()
        self.assertEqual("http://127.0.0.1:9001/api/health", helper.BACKEND_COMPONENT.health_url)
        self.assertEqual("http://127.0.0.1:8081/", helper.FRONTEND_COMPONENT.health_url)

    def test_helper_marks_backend_health_ok_only_for_status_ok(self) -> None:
        helper = _load_helper()
        self.assertTrue(helper._health_ok(helper.BACKEND_COMPONENT, b'{"status":"ok"}', 200))
        self.assertFalse(helper._health_ok(helper.BACKEND_COMPONENT, b'{"status":"degraded"}', 200))


if __name__ == "__main__":
    unittest.main()
