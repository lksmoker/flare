from __future__ import annotations

import argparse
import json
import sys
from pathlib import Path

if __package__ is None or __package__ == "":
    sys.path.insert(0, str(Path(__file__).resolve().parents[2]))

from backend.app.db.support_channel_repository import SupportChannelRepository
from backend.app.integrations.groupme_provider import GroupMeProvider
from backend.app.services.support_channel_config import (
    load_supabase_admin_config,
)
from backend.app.services.support_channel_provider_config import ProviderConfigResolver
from backend.app.services.support_channel_sender import (
    SendSupportChannelTestMessageCommand,
    SupportChannelSender,
)


def main() -> int:
    parser = argparse.ArgumentParser(
        description="Send the dedicated GroupMe test flare for one saved support channel."
    )
    parser.add_argument("--support-channel-id", required=True)
    parser.add_argument("--user-id", required=True)
    args = parser.parse_args()

    repository = SupportChannelRepository(config=load_supabase_admin_config())
    sender = SupportChannelSender(
        repository=repository,
        groupme_provider=GroupMeProvider(),
        provider_config_resolver=ProviderConfigResolver(),
    )
    result = sender.send_test_message(
        SendSupportChannelTestMessageCommand(
            support_channel_id=args.support_channel_id,
            user_id=args.user_id,
        )
    )
    print(json.dumps(result.to_public_dict(), indent=2, sort_keys=True))
    return 0 if result.ok else 1


if __name__ == "__main__":
    raise SystemExit(main())
