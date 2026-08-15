"use client";

import { Eye } from "lucide-react";
import { useMemo, useRef, useState } from "react";
import type { FormEvent, ReactNode } from "react";
import { useRouter } from "next/navigation";

type AuthMode = "login" | "register";
type AuthStep = "email" | "register-details" | "activation" | "login-code";

type AuthViewProps = {
  initialMode?: AuthMode;
  nextPath?: string;
};

const logoSrc = "/clingo-homepage/assets/images/logo-clingo-color-new.png";
const authApiBaseUrl = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:4000";

type AuthApiError = Error & {
  status?: number;
};

async function postAuthJson<T>(path: string, body: Record<string, unknown>): Promise<T> {
  const response = await fetch(`${authApiBaseUrl}${path}`, {
    body: JSON.stringify(body),
    cache: "no-store",
    headers: {
      "Content-Type": "application/json"
    },
    method: "POST"
  });

  if (!response.ok) {
    const error: AuthApiError = new Error(`Auth request failed with status ${response.status}.`);
    error.status = response.status;
    throw error;
  }

  return response.json();
}

function getSafeNextPath(value?: string) {
  if (!value || !value.startsWith("/") || value.startsWith("//")) {
    return "/zamowienia";
  }

  if (value.startsWith("/logowanie") || value.startsWith("/rejestracja")) {
    return "/zamowienia";
  }

  return value;
}

function setLocalSession(email: string) {
  document.cookie = "clingo-auth=1; path=/; max-age=2592000; SameSite=Lax";
  document.cookie = `clingo-user-email=${encodeURIComponent(email)}; path=/; max-age=2592000; SameSite=Lax`;
  window.localStorage.setItem(
    "clingo-auth",
    JSON.stringify({
      email,
      signedInAt: new Date().toISOString()
    })
  );
}

function AuthShell({
  children,
  subtitle,
  title,
  trailingComma = true
}: {
  children: ReactNode;
  subtitle: string;
  title: string;
  trailingComma?: boolean;
}) {
  return (
    <main className="relative z-10 mx-auto flex min-h-screen w-full max-w-[420px] flex-col gap-5 px-4 pb-20 pt-[50px] sm:px-0">
      <a className="relative block h-[55px] w-[180px]" href="/home" aria-label="Clingo">
        <img alt="Clingo" className="absolute inset-0 h-full w-full object-contain" src={logoSrc} />
      </a>

      <header className="pl-[5px] text-[#2e3b4c]">
        <h1 className="m-0 text-[30px] font-semibold leading-[48px]">
          {title}
          {trailingComma ? "," : null}
        </h1>
        <p className="m-0 text-[22px] font-normal leading-[38px]">{subtitle}</p>
      </header>

      {children}
    </main>
  );
}

function FloatingInput({
  autoComplete,
  label,
  name,
  onChange,
  readOnly = false,
  required = true,
  rightSlot,
  type = "text",
  value
}: {
  autoComplete?: string;
  label: string;
  name: string;
  onChange: (value: string) => void;
  readOnly?: boolean;
  required?: boolean;
  rightSlot?: ReactNode;
  type?: string;
  value: string;
}) {
  return (
    <div className="relative flex h-[60px] w-full items-end">
      <label
        className="absolute left-[19px] top-0 z-10 rounded-[10px] bg-[#fbfdff] px-1 py-[2px] text-[14px] leading-none text-[#2e3b4c]"
        htmlFor={name}
      >
        {label}
      </label>
      <input
        autoComplete={autoComplete}
        className={[
          "h-[52px] w-full rounded-[30px] border border-[#dce0e3] px-[22px] text-[14px] outline-none transition-colors focus:border-[#0079de]",
          readOnly ? "bg-[#f9fafb] pr-[90px] text-[#7c8691]" : "bg-white text-[#2e3b4c]",
          rightSlot ? "pr-[54px]" : ""
        ].join(" ")}
        id={name}
        name={name}
        onChange={(event) => onChange(event.target.value)}
        readOnly={readOnly}
        required={required}
        type={type}
        value={value}
      />
      {rightSlot ? <div className="absolute bottom-[18px] right-[20px] z-10">{rightSlot}</div> : null}
    </div>
  );
}

function PrimaryButton({ children, disabled = false }: { children: ReactNode; disabled?: boolean }) {
  return (
    <button
      className={[
        "flex h-[52px] w-full items-center justify-center rounded-[30px] border border-[#e6edf3] bg-[#0079de] text-[14px] font-semibold leading-[48px] text-white transition-colors hover:bg-[#006bc6] focus-visible:bg-[#006bc6] focus-visible:outline-none",
        disabled ? "cursor-wait opacity-70" : ""
      ].join(" ")}
      disabled={disabled}
      type="submit"
    >
      {children}
    </button>
  );
}

function TermsText() {
  return (
    <p className="m-0 pl-[5px] text-[14px] leading-normal text-[#2e3b4c]">
      Zakładając konto, akceptujesz nasze{" "}
      <a className="font-semibold text-[#0079de]" href="#">
        Warunki użytkowania
      </a>
      . Dowiedz się, w jaki sposób postępujemy z Twoimi danymi w naszej{" "}
      <a className="font-semibold text-[#0079de]" href="#">
        Polityce prywatności
      </a>
      . Sprawdź{" "}
      <a className="font-semibold text-[#0079de]" href="#">
        Dane firmy
      </a>{" "}
      Clingo.
    </p>
  );
}

function SocialButton({ brand, label }: { brand: "apple" | "facebook" | "google"; label: string }) {
  const mark = {
    apple: { className: "text-black", value: "A" },
    facebook: { className: "text-[#1877f2]", value: "f" },
    google: { className: "text-[#4285f4]", value: "G" }
  }[brand];

  return (
    <button
      className="flex h-[52px] w-full items-center justify-center gap-[10px] rounded-[30px] border border-[#e6edf3] bg-white px-[30px] py-2 text-[14px] font-semibold leading-[22px] text-[#2e3b4c] shadow-[0px_1px_4px_0px_rgba(0,0,0,0.04)]"
      type="button"
    >
      <span className={`grid h-[18px] w-[18px] place-items-center text-[17px] font-bold leading-none ${mark.className}`} aria-hidden="true">
        {mark.value}
      </span>
      <span>{label}</span>
    </button>
  );
}

function CodeFields({
  code,
  inputRefs,
  onChange
}: {
  code: string[];
  inputRefs: React.MutableRefObject<Array<HTMLInputElement | null>>;
  onChange: (index: number, value: string) => void;
}) {
  return (
    <div className="flex w-full items-center gap-2">
      {code.map((digit, index) => (
        <span className="contents" key={index}>
          <input
            aria-label={`Cyfra kodu ${index + 1}`}
            className="h-[51px] min-w-0 flex-1 rounded-[20px] border border-[#dce0e3] bg-white text-center text-[20px] font-semibold text-[#2e3b4c] outline-none focus:border-[#0079de]"
            inputMode="numeric"
            maxLength={1}
            onChange={(event) => onChange(index, event.target.value)}
            ref={(element) => {
              inputRefs.current[index] = element;
            }}
            type="text"
            value={digit}
          />
          {index < code.length - 1 ? <span className="h-px w-3 shrink-0 bg-[#dce0e3]" aria-hidden="true" /> : null}
        </span>
      ))}
    </div>
  );
}

export function AuthView({ nextPath }: AuthViewProps) {
  const router = useRouter();
  const safeNextPath = useMemo(() => getSafeNextPath(nextPath), [nextPath]);
  const [step, setStep] = useState<AuthStep>("email");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [companyName, setCompanyName] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [activationCode, setActivationCode] = useState(["", "", "", ""]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [statusMessage, setStatusMessage] = useState("");
  const codeInputRefs = useRef<Array<HTMLInputElement | null>>([]);

  const completeAuth = () => {
    setLocalSession(email || "konto@clingo.local");
    router.replace(safeNextPath);
    router.refresh();
  };

  const updateEmail = (value: string) => {
    setEmail(value);

    if (statusMessage) {
      setStatusMessage("");
    }
  };

  const submitEmail = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const checkedEmail = email.trim();

    if (!checkedEmail) {
      setStatusMessage("Wpisz adres e-mail.");
      return;
    }

    setIsSubmitting(true);
    setStatusMessage("");

    try {
      const result = await postAuthJson<{ exists: boolean }>("/auth/lookup", { email: checkedEmail });
      setActivationCode(["", "", "", ""]);
      setStep(result.exists ? "login-code" : "register-details");
    } catch {
      setStatusMessage("Nie udało się sprawdzić adresu w bazie. Sprawdź, czy API i baza danych są uruchomione.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const submitRegistration = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setIsSubmitting(true);
    setStatusMessage("");

    try {
      await postAuthJson("/auth/register", {
        companyName,
        email,
        firstName,
        lastName,
        password,
        phone
      });
      setActivationCode(["", "", "", ""]);
      setStep("activation");
    } catch (error) {
      if ((error as AuthApiError).status === 409) {
        setStatusMessage("Konto z tym adresem już istnieje. Przenoszę do logowania.");
        setStep("login-code");
        return;
      }

      setStatusMessage("Nie udało się utworzyć konta. Sprawdź dane i spróbuj ponownie.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const submitLogin = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    completeAuth();
  };

  const updateActivationDigit = (index: number, value: string) => {
    const digit = value.replace(/\D/g, "").slice(-1);
    const nextCode = [...activationCode];
    nextCode[index] = digit;
    setActivationCode(nextCode);

    if (digit && index < codeInputRefs.current.length - 1) {
      codeInputRefs.current[index + 1]?.focus();
    }

    if (digit && nextCode.every(Boolean)) {
      window.setTimeout(completeAuth, 150);
    }
  };

  if (step === "register-details") {
    return (
      <AuthShell subtitle="i zamawiaj w mgnieniu oka" title="Utwórz hasło" trailingComma={false}>
        <form className="flex w-full flex-col gap-5" onSubmit={submitRegistration}>
          <FloatingInput
            autoComplete="email"
            label="Adres e-mail"
            name="email"
            onChange={setEmail}
            readOnly
            rightSlot={
              <button
                className="border-0 bg-transparent p-0 text-[14px] font-medium text-[#0079de]"
                onClick={() => {
                  setStatusMessage("");
                  setStep("email");
                }}
                type="button"
              >
                Edytuj
              </button>
            }
            type="email"
            value={email}
          />
          <FloatingInput autoComplete="tel" label="Numer telefonu" name="phone" onChange={setPhone} type="tel" value={phone} />
          <FloatingInput
            autoComplete="new-password"
            label="Hasło"
            name="password"
            onChange={setPassword}
            rightSlot={
              <button
                aria-label={showPassword ? "Ukryj hasło" : "Pokaż hasło"}
                className="grid h-4 w-4 place-items-center border-0 bg-transparent p-0 text-[#2e3b4c]"
                onClick={() => setShowPassword((value) => !value)}
                type="button"
              >
                <Eye aria-hidden="true" className="h-4 w-4" strokeWidth={1.8} />
              </button>
            }
            type={showPassword ? "text" : "password"}
            value={password}
          />
          <FloatingInput autoComplete="given-name" label="Imię" name="first-name" onChange={setFirstName} value={firstName} />
          <FloatingInput autoComplete="family-name" label="Nazwisko" name="last-name" onChange={setLastName} value={lastName} />
          <FloatingInput
            autoComplete="organization"
            label="Nazwa firmy (opcjonalne)"
            name="company-name"
            onChange={setCompanyName}
            required={false}
            value={companyName}
          />
          {statusMessage ? <p className="m-0 pl-[5px] text-[14px] leading-normal text-[#d63b3b]">{statusMessage}</p> : null}
          <PrimaryButton disabled={isSubmitting}>{isSubmitting ? "Tworzenie konta..." : "Zarejestruj się"}</PrimaryButton>
          <TermsText />
        </form>
      </AuthShell>
    );
  }

  if (step === "activation") {
    return (
      <AuthShell subtitle="wysłaliśmy 4 cyfrowy kod aktywacyjny" title="Aktywuj konto">
        <form className="flex w-full flex-col gap-5" onSubmit={(event) => { event.preventDefault(); completeAuth(); }}>
          <section className="flex w-full flex-col gap-5 rounded-[20px] drop-shadow-[0px_2px_7px_rgba(0,0,0,0.04)]">
            <p className="m-0 text-[14px] font-medium leading-normal text-[#2e3b4c]">Wpisz przesłany kod poniżej</p>
            <CodeFields code={activationCode} inputRefs={codeInputRefs} onChange={updateActivationDigit} />
          </section>

          <p className="m-0 pl-[5px] text-[14px] leading-normal text-[#2e3b4c]">
            Wiadomość nie dotarła?{" "}
            <button className="border-0 bg-transparent p-0 font-semibold text-[#0079de]" type="button">
              Wyślij kod ponownie
            </button>
          </p>
          <p className="m-0 pl-[5px] text-[14px] leading-normal text-[#2e3b4c]">
            Podałeś zły numer?{" "}
            <button className="border-0 bg-transparent p-0 font-semibold text-[#0079de]" onClick={() => setStep("register-details")} type="button">
              Cofnij i zmień numer telefonu
            </button>
          </p>
          <div className="h-px w-[138px]" aria-hidden="true" />
          <p className="m-0 pl-[5px] text-[14px] leading-normal text-[#2e3b4c]">
            Po aktywacji konta strona automatycznie się odświeży. Sprawdź swoją pocztę pod wskazany wyżej adres e-mail.
          </p>
        </form>
      </AuthShell>
    );
  }

  if (step === "login-code") {
    return (
      <AuthShell subtitle="wpisz jednorazowy kod z e-maila" title="Zaloguj się">
        <form className="flex w-full flex-col gap-5" onSubmit={submitLogin}>
          <FloatingInput autoComplete="email" label="Adres e-mail" name="email" onChange={updateEmail} type="email" value={email} />
          {statusMessage ? <p className="m-0 pl-[5px] text-[14px] leading-normal text-[#2e3b4c]">{statusMessage}</p> : null}
          <section className="flex w-full flex-col gap-5 rounded-[20px]">
            <p className="m-0 text-[14px] font-medium leading-normal text-[#2e3b4c]">Wpisz kod przesłany na adres e-mail</p>
            <CodeFields code={activationCode} inputRefs={codeInputRefs} onChange={updateActivationDigit} />
          </section>
          <p className="m-0 pl-[5px] text-[14px] leading-normal text-[#2e3b4c]">
            Wiadomość nie dotarła?{" "}
            <button className="border-0 bg-transparent p-0 font-semibold text-[#0079de]" type="button">
              Wyślij kod ponownie
            </button>
          </p>
          <p className="m-0 pl-[5px] text-[14px] leading-normal text-[#2e3b4c]">
            To nie ten adres?{" "}
            <button className="border-0 bg-transparent p-0 font-semibold text-[#0079de]" onClick={() => setStep("email")} type="button">
              Zmień adres e-mail
            </button>
          </p>
          <PrimaryButton>Zaloguj się</PrimaryButton>
        </form>
      </AuthShell>
    );
  }

  return (
    <AuthShell subtitle="aby dokonać zamówienia" title="Zaloguj się lub zarejestruj">
      <form className="flex w-full flex-col gap-5" onSubmit={submitEmail}>
        <FloatingInput autoComplete="email" label="Adres e-mail" name="email" onChange={updateEmail} type="email" value={email} />
        {statusMessage ? <p className="m-0 pl-[5px] text-[14px] leading-normal text-[#d63b3b]">{statusMessage}</p> : null}
        <PrimaryButton disabled={isSubmitting}>{isSubmitting ? "Sprawdzam..." : "Kontynuuj"}</PrimaryButton>
      </form>

      <TermsText />

      <section className="flex w-full flex-col gap-3">
        <SocialButton brand="google" label="Kontynuuj z Google" />
        <SocialButton brand="facebook" label="Kontynuuj z Facebook" />
        <SocialButton brand="apple" label="Kontynuuj z Apple" />
      </section>

      <p className="m-0 px-[5px] text-center text-[14px] leading-normal text-[#7c8691]">
        Wpisz e-mail, a sprawdzimy, czy masz już konto.
      </p>
    </AuthShell>
  );
}
