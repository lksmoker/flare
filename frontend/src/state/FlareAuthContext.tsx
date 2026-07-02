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
  type FlareSupabaseAuthSubscription,
  resolveFlareSupabaseAuthState,
  sendFlareSupabaseMagicLink,
  signUpForFlareSupabase,
  signInToFlareSupabaseWithPassword,
  signOutFromFlareSupabase,
  subscribeToFlareSupabaseAuthState,
} from "../services/flareSupabaseAuth";

type FlareAuthContextValue = {
  authState: FlareSupabaseAuthState;
  authStatus: "loading" | "ready";
  errorMessage: string | null;
  pendingAction: "magic-link" | "password" | "sign-out" | "sign-up" | null;
  sendMagicLink: (email: string) => Promise<void>;
  signInWithPassword: (email: string, password: string) => Promise<void>;
  signUp: (email: string, password: string) => Promise<void>;
  signOut: () => Promise<void>;
};

type FlareAuthProviderProps = PropsWithChildren<{
  initialAuthState?: FlareSupabaseAuthState;
  resolveAuthState?: () => Promise<FlareSupabaseAuthState>;
  sendMagicLinkRequest?: (email: string) => Promise<void>;
  signInWithPasswordRequest?: (email: string, password: string) => Promise<void>;
  signUpRequest?: (email: string, password: string) => Promise<void>;
  signOutRequest?: () => Promise<void>;
  subscribe?: (
    onChange: (authState: FlareSupabaseAuthState) => void,
  ) => { unsubscribe: () => void } | null;
}>;

const FlareAuthContext = createContext<FlareAuthContextValue | null>(null);

const DEFAULT_INITIAL_AUTH_STATE: FlareSupabaseAuthState = {
  kind: "no-session",
};

const defaultResolveAuthState = () => resolveFlareSupabaseAuthState();

const defaultSignInWithPasswordRequest = (email: string, password: string) =>
  signInToFlareSupabaseWithPassword({ email, password });

const defaultSignUpRequest = (email: string, password: string) =>
  signUpForFlareSupabase({ email, password });

const defaultSubscribe = (
  onChange: (authState: FlareSupabaseAuthState) => void,
): FlareSupabaseAuthSubscription | null =>
  subscribeToFlareSupabaseAuthState((authState) => {
    onChange(authState);
  });

function areAuthStatesEqual(
  left: FlareSupabaseAuthState,
  right: FlareSupabaseAuthState,
) {
  if (left.kind !== right.kind) {
    return false;
  }

  if (left.kind === "authenticated" && right.kind === "authenticated") {
    return (
      left.userId === right.userId && left.userEmail === right.userEmail
    );
  }

  if (
    left.kind === "client-unavailable" &&
    right.kind === "client-unavailable"
  ) {
    return left.reason === right.reason;
  }

  return true;
}

function getErrorMessage(error: unknown) {
  if (error instanceof Error && error.message.trim().length > 0) {
    return error.message;
  }

  return "Auth request failed.";
}

export function FlareAuthProvider({
  children,
  initialAuthState,
  resolveAuthState,
  sendMagicLinkRequest,
  signInWithPasswordRequest,
  signUpRequest,
  signOutRequest,
  subscribe,
}: FlareAuthProviderProps) {
  const effectiveResolveAuthState = resolveAuthState ?? defaultResolveAuthState;
  const effectiveSendMagicLinkRequest =
    sendMagicLinkRequest ?? sendFlareSupabaseMagicLink;
  const effectiveSignInWithPasswordRequest =
    signInWithPasswordRequest ?? defaultSignInWithPasswordRequest;
  const effectiveSignUpRequest = signUpRequest ?? defaultSignUpRequest;
  const effectiveSignOutRequest = signOutRequest ?? signOutFromFlareSupabase;
  const effectiveSubscribe = subscribe ?? defaultSubscribe;
  const [authState, setAuthState] = useState<FlareSupabaseAuthState>(
    initialAuthState ?? DEFAULT_INITIAL_AUTH_STATE,
  );
  const [authStatus, setAuthStatus] = useState<"loading" | "ready">(
    initialAuthState ? "ready" : "loading",
  );
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [pendingAction, setPendingAction] = useState<
    "magic-link" | "password" | "sign-out" | "sign-up" | null
  >(null);

  useEffect(() => {
    let isActive = true;

    async function initializeAuth() {
      try {
        const nextAuthState = await effectiveResolveAuthState();

        if (isActive) {
          setAuthState((currentAuthState) =>
            areAuthStatesEqual(currentAuthState, nextAuthState)
              ? currentAuthState
              : nextAuthState,
          );
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

    const subscription = effectiveSubscribe((nextAuthState) => {
      if (!isActive) {
        return;
      }

      setAuthState((currentAuthState) =>
        areAuthStatesEqual(currentAuthState, nextAuthState)
          ? currentAuthState
          : nextAuthState,
      );
      setAuthStatus("ready");
      setErrorMessage(null);
      setPendingAction(null);
    });

    return () => {
      isActive = false;
      subscription?.unsubscribe();
    };
  }, [effectiveResolveAuthState, effectiveSubscribe, initialAuthState]);

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
          await effectiveSendMagicLinkRequest(email);
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
          await effectiveSignInWithPasswordRequest(email, password);
        } catch (error) {
          setErrorMessage(getErrorMessage(error));
          throw error;
        } finally {
          setPendingAction((current) =>
            current === "password" ? null : current,
          );
        }
      },
      async signUp(email, password) {
        setErrorMessage(null);
        setPendingAction("sign-up");

        try {
          await effectiveSignUpRequest(email, password);
        } catch (error) {
          setErrorMessage(getErrorMessage(error));
          throw error;
        } finally {
          setPendingAction((current) =>
            current === "sign-up" ? null : current,
          );
        }
      },
      async signOut() {
        setErrorMessage(null);
        setPendingAction("sign-out");

        try {
          await effectiveSignOutRequest();
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
      effectiveSendMagicLinkRequest,
      effectiveSignInWithPasswordRequest,
      effectiveSignUpRequest,
      effectiveSignOutRequest,
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
