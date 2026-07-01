import {
  createContext,
  PropsWithChildren,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";

import {
  type FlareSupabaseAuthState,
  resolveFlareSupabaseAuthState,
  sendFlareSupabaseMagicLink,
  signInToFlareSupabaseWithPassword,
  signOutFromFlareSupabase,
  subscribeToFlareSupabaseAuthState,
} from "../services/flareSupabaseAuth";

type FlareAuthContextValue = {
  authState: FlareSupabaseAuthState;
  authStatus: "loading" | "ready";
  errorMessage: string | null;
  pendingAction: "magic-link" | "password" | "sign-out" | null;
  sendMagicLink: (email: string) => Promise<void>;
  signInWithPassword: (email: string, password: string) => Promise<void>;
  signOut: () => Promise<void>;
};

type FlareAuthProviderProps = PropsWithChildren<{
  initialAuthState?: FlareSupabaseAuthState;
  resolveAuthState?: () => Promise<FlareSupabaseAuthState>;
  sendMagicLinkRequest?: (email: string) => Promise<void>;
  signInWithPasswordRequest?: (email: string, password: string) => Promise<void>;
  signOutRequest?: () => Promise<void>;
  subscribe?: (
    onChange: (authState: FlareSupabaseAuthState) => void,
  ) => { unsubscribe: () => void } | null;
}>;

const FlareAuthContext = createContext<FlareAuthContextValue | null>(null);

function getErrorMessage(error: unknown) {
  if (error instanceof Error && error.message.trim().length > 0) {
    return error.message;
  }

  return "Auth request failed.";
}

export function FlareAuthProvider({
  children,
  initialAuthState,
  resolveAuthState = resolveFlareSupabaseAuthState,
  sendMagicLinkRequest = sendFlareSupabaseMagicLink,
  signInWithPasswordRequest = (email, password) =>
    signInToFlareSupabaseWithPassword({ email, password }),
  signOutRequest = signOutFromFlareSupabase,
  subscribe = (onChange) =>
    subscribeToFlareSupabaseAuthState((authState) => {
      onChange(authState);
    }),
}: FlareAuthProviderProps) {
  const [authState, setAuthState] = useState<FlareSupabaseAuthState>(
    initialAuthState ?? {
      kind: "no-session",
    },
  );
  const [authStatus, setAuthStatus] = useState<"loading" | "ready">(
    initialAuthState ? "ready" : "loading",
  );
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [pendingAction, setPendingAction] = useState<
    "magic-link" | "password" | "sign-out" | null
  >(null);

  useEffect(() => {
    let isActive = true;

    async function initializeAuth() {
      try {
        const nextAuthState = await resolveAuthState();

        if (isActive) {
          setAuthState(nextAuthState);
        }
      } finally {
        if (isActive) {
          setAuthStatus("ready");
        }
      }
    }

    if (!initialAuthState) {
      void initializeAuth();
    }

    const subscription = subscribe((nextAuthState) => {
      if (!isActive) {
        return;
      }

      setAuthState(nextAuthState);
      setAuthStatus("ready");
      setErrorMessage(null);
      setPendingAction(null);
    });

    return () => {
      isActive = false;
      subscription?.unsubscribe();
    };
  }, [initialAuthState, resolveAuthState, subscribe]);

  const value = useMemo<FlareAuthContextValue>(
    () => ({
      authState,
      authStatus,
      errorMessage,
      pendingAction,
      async sendMagicLink(email) {
        setErrorMessage(null);
        setPendingAction("magic-link");

        try {
          await sendMagicLinkRequest(email);
        } catch (error) {
          setErrorMessage(getErrorMessage(error));
          throw error;
        } finally {
          setPendingAction((current) =>
            current === "magic-link" ? null : current,
          );
        }
      },
      async signInWithPassword(email, password) {
        setErrorMessage(null);
        setPendingAction("password");

        try {
          await signInWithPasswordRequest(email, password);
        } catch (error) {
          setErrorMessage(getErrorMessage(error));
          throw error;
        } finally {
          setPendingAction((current) =>
            current === "password" ? null : current,
          );
        }
      },
      async signOut() {
        setErrorMessage(null);
        setPendingAction("sign-out");

        try {
          await signOutRequest();
          setAuthState({ kind: "no-session" });
        } catch (error) {
          setErrorMessage(getErrorMessage(error));
          throw error;
        } finally {
          setPendingAction((current) =>
            current === "sign-out" ? null : current,
          );
        }
      },
    }),
    [
      authState,
      authStatus,
      errorMessage,
      pendingAction,
      sendMagicLinkRequest,
      signInWithPasswordRequest,
      signOutRequest,
    ],
  );

  return (
    <FlareAuthContext.Provider value={value}>
      {children}
    </FlareAuthContext.Provider>
  );
}

export function useFlareAuth() {
  const context = useContext(FlareAuthContext);

  if (!context) {
    throw new Error("useFlareAuth must be used within a FlareAuthProvider.");
  }

  return context;
}

export function useOptionalFlareAuth() {
  return useContext(FlareAuthContext);
}
