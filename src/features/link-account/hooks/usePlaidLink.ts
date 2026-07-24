import { useCallback, useState } from "react";
import {
  create,
  open,
  LinkSuccess,
  LinkExit,
  LinkIOSPresentationStyle,
} from "react-native-plaid-link-sdk";
import { bankLinkRepository as repository } from "@data/repositories";

type Phase = "idle" | "fetchingToken" | "linking" | "exchanging" | "syncing" | "done" | "error";

export function usePlaidLink(userId: string | null) {
  const [phase, setPhase] = useState<Phase>("idle");
  const [error, setError] = useState<string | null>(null);

  const connect = useCallback(async () => {
    if (!userId) return;
    setError(null);

    try {
      setPhase("fetchingToken");
      const linkToken = await repository.createLinkToken(userId);

      create({ token: linkToken });

      setPhase("linking");
      open({
        iOSPresentationStyle: LinkIOSPresentationStyle.MODAL,
        onSuccess: async (success: LinkSuccess) => {
          try {
            setPhase("exchanging");
            await repository.exchangePublicToken(userId, success.publicToken);
            setPhase("syncing");
            await repository.triggerSync(userId);
            setPhase("done");
          } catch (e) {
            setError((e as Error).message);
            setPhase("error");
          }
        },
        onExit: (linkExit: LinkExit) => {
          if (linkExit.error) {
            setError(linkExit.error.errorMessage ?? "Connection was cancelled.");
            setPhase("error");
          } else {
            setPhase("idle");
          }
        },
      });
    } catch (e) {
      setError((e as Error).message);
      setPhase("error");
    }
  }, [userId]);

  return { connect, phase, error };
}
