import { useRef, useState } from "react";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

import { logger } from "@/lib/logger";

const LOG_SOURCE = "CalDAVAccountForm";

// Define types for test results
interface TestStep {
  step: string;
  status: "pending" | "success" | "failed";
  error?: string;
  calendars?: number;
  calendarNames?: string[];
}

interface TestResult {
  steps: TestStep[];
  success: boolean;
  error: string | null;
  details: string | null;
}

interface CalDAVAccountFormProps {
  preset?: "apple" | "generic";
  onSuccess?: () => void;
  onCancel?: () => void;
}

type RequiredField = "serverUrl" | "username" | "password";
type FieldErrors = Partial<Record<RequiredField, string>>;

/**
 * Form component for adding a new CalDAV account
 * Collects server URL, username, password, and optional path
 */
export function CalDAVAccountForm({
  preset = "generic",
  onSuccess,
  onCancel,
}: CalDAVAccountFormProps) {
  const isApple = preset === "apple";
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isTesting, setIsTesting] = useState(false);
  const [formData, setFormData] = useState({
    serverUrl: isApple ? "https://caldav.icloud.com" : "",
    username: "",
    password: "",
    path: "", // Optional path for some CalDAV servers
  });
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});
  const [testResults, setTestResults] = useState<TestResult | null>(null);
  const serverUrlRef = useRef<HTMLInputElement>(null);
  const usernameRef = useRef<HTMLInputElement>(null);
  const passwordRef = useRef<HTMLInputElement>(null);

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    if (name === "serverUrl" || name === "username" || name === "password") {
      setFieldErrors((current) => ({ ...current, [name]: undefined }));
    }

    // Clear error when user makes changes
    if (errorMessage) {
      setErrorMessage(null);
    }

    // Clear test results when form changes
    if (testResults) {
      setTestResults(null);
    }
  };

  const validateRequiredFields = () => {
    const nextErrors: FieldErrors = {};
    if (!formData.serverUrl.trim())
      nextErrors.serverUrl = "Enter the CalDAV server URL.";
    if (!formData.username.trim())
      nextErrors.username = isApple
        ? "Enter your Apple Account email."
        : "Enter your CalDAV username.";
    if (!formData.password)
      nextErrors.password = isApple
        ? "Enter an Apple app-specific password."
        : "Enter your CalDAV password.";

    setFieldErrors(nextErrors);
    const firstMissing = (
      ["serverUrl", "username", "password"] as RequiredField[]
    ).find((field) => nextErrors[field]);
    if (!firstMissing) return true;

    setErrorMessage("Check the highlighted fields, then try again.");
    const refs = {
      serverUrl: serverUrlRef,
      username: usernameRef,
      password: passwordRef,
    };
    window.requestAnimationFrame(() => refs[firstMissing].current?.focus());
    return false;
  };

  const handleTest = async () => {
    // Validate form
    if (!validateRequiredFields()) return;

    try {
      setIsTesting(true);
      setErrorMessage(null);
      setTestResults(null);

      // Ensure the server URL has the correct format
      let serverUrl = formData.serverUrl;
      if (
        !serverUrl.startsWith("http://") &&
        !serverUrl.startsWith("https://")
      ) {
        serverUrl = `https://${serverUrl}`;
      }

      // Remove trailing slash if present
      if (serverUrl.endsWith("/")) {
        serverUrl = serverUrl.slice(0, -1);
      }

      const response = await fetch("/api/calendar/caldav/test", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          serverUrl,
          username: formData.username,
          password: formData.password,
          path: formData.path || undefined,
        }),
      });

      const data = await response.json();
      setTestResults(data as TestResult);

      if (!response.ok || !data.success) {
        throw new Error(data.error || "Failed to connect to CalDAV server");
      }

      logger.info(
        "CalDAV test connection successful",
        { serverUrl, username: formData.username },
        LOG_SOURCE
      );
    } catch (error) {
      logger.error(
        "CalDAV test connection failed",
        {
          error: error instanceof Error ? error.message : "Unknown error",
        },
        LOG_SOURCE
      );
      setErrorMessage(
        error instanceof Error
          ? error.message
          : "Failed to connect to CalDAV server"
      );
    } finally {
      setIsTesting(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    // Validate form
    if (!validateRequiredFields()) return;

    try {
      setIsSubmitting(true);

      // Ensure the server URL has the correct format
      let serverUrl = formData.serverUrl;
      if (
        !serverUrl.startsWith("http://") &&
        !serverUrl.startsWith("https://")
      ) {
        serverUrl = `https://${serverUrl}`;
      }

      // Remove trailing slash if present
      if (serverUrl.endsWith("/")) {
        serverUrl = serverUrl.slice(0, -1);
      }

      const response = await fetch("/api/calendar/caldav/auth", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          serverUrl,
          username: formData.username,
          password: formData.password,
          path: formData.path || undefined,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(
          errorData.error || "Failed to connect to CalDAV server"
        );
      }

      await response.json();

      alert(
        `Successfully connected ${isApple ? "Apple Calendar" : "CalDAV calendar"} for ${formData.username}`
      );

      if (onSuccess) {
        onSuccess();
      }
    } catch (error) {
      logger.error(
        "Failed to connect CalDAV account",
        {
          error: error instanceof Error ? error.message : "Unknown error",
        },
        LOG_SOURCE
      );
      setErrorMessage(
        error instanceof Error
          ? error.message
          : "Failed to connect to CalDAV server"
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  // Render test results
  const renderTestResults = () => {
    if (!testResults) return null;

    return (
      <div className="mt-4 rounded-xl border border-border bg-muted p-4">
        <h3 className="mb-2 font-medium">Connection Test Results</h3>

        {testResults.steps &&
          testResults.steps.map((step, index) => (
            <div key={index} className="mb-2">
              <div className="flex items-center">
                <span
                  className={`mr-2 ${
                    step.status === "success"
                      ? "text-success"
                      : step.status === "failed"
                        ? "text-destructive"
                        : "text-warning"
                  }`}
                >
                  {step.status === "success"
                    ? "✓"
                    : step.status === "failed"
                      ? "✗"
                      : "⟳"}
                </span>
                <span className="font-medium">{step.step}</span>
                {step.status === "success" && step.calendars !== undefined && (
                  <span className="ml-2 text-sm text-muted-foreground">
                    ({step.calendars} calendars found)
                  </span>
                )}
              </div>

              {step.error && (
                <div className="ml-6 mt-1 whitespace-pre-wrap text-sm text-destructive">
                  Error: {step.error}
                </div>
              )}

              {step.calendarNames && step.calendarNames.length > 0 && (
                <div className="ml-6 mt-1 text-sm text-muted-foreground">
                  Calendars: {step.calendarNames.join(", ")}
                </div>
              )}
            </div>
          ))}

        {testResults.error && !testResults.steps?.some((s) => s.error) && (
          <div className="mt-2 text-destructive">
            <div className="font-medium">Error:</div>
            <div className="whitespace-pre-wrap text-sm">
              {testResults.error}
            </div>
          </div>
        )}

        {testResults.success && (
          <div className="mt-2 font-medium text-success">
            Connection successful! You can now connect your account.
          </div>
        )}
      </div>
    );
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>
          {isApple ? "Connect Apple Calendar" : "Connect CalDAV Account"}
        </CardTitle>
        <CardDescription>
          {isApple
            ? "Bring your iCloud calendars into Sunnie with secure CalDAV sync."
            : "Add a calendar from Fastmail, Nextcloud, or another CalDAV provider."}
        </CardDescription>
      </CardHeader>
      <form onSubmit={handleSubmit} noValidate>
        <CardContent className="space-y-4">
          {errorMessage && (
            <div
              role="alert"
              aria-live="assertive"
              className="mb-3 rounded-xl border border-destructive/30 bg-destructive/10 p-3 text-sm text-destructive"
            >
              {errorMessage}
            </div>
          )}

          {isApple ? (
            <div className="rounded-2xl border border-warning/30 bg-warning/10 p-4 text-sm text-foreground">
              <p className="font-medium">Before you connect</p>
              <p className="mt-1 leading-relaxed">
                Create an app-specific password in your Apple Account. Never use
                your normal Apple Account password here.
              </p>
              <a
                href="https://account.apple.com/account/manage"
                target="_blank"
                rel="noopener noreferrer"
                className="mt-2 inline-block font-medium text-warning underline underline-offset-4"
              >
                Open Apple Account security
              </a>
            </div>
          ) : (
            <fieldset className="mb-4">
              <Label
                className="mb-2.5 text-[15px] leading-normal"
                htmlFor="serverUrl"
              >
                Server URL <span className="text-destructive">*</span>
              </Label>
              <Input
                ref={serverUrlRef}
                id="serverUrl"
                name="serverUrl"
                placeholder="https://caldav.example.com"
                value={formData.serverUrl}
                onChange={handleChange}
                required
                aria-invalid={Boolean(fieldErrors.serverUrl)}
                aria-describedby={
                  fieldErrors.serverUrl ? "serverUrl-error" : undefined
                }
              />
              {fieldErrors.serverUrl && (
                <p
                  id="serverUrl-error"
                  className="mt-1 text-sm text-destructive"
                >
                  {fieldErrors.serverUrl}
                </p>
              )}
              <p className="mt-1 text-sm text-muted-foreground">
                For Fastmail: https://caldav.fastmail.com
              </p>
            </fieldset>
          )}

          <fieldset className="mb-4">
            <Label
              className="mb-2.5 text-[15px] leading-normal"
              htmlFor="username"
            >
              {isApple ? "Apple Account email" : "Username"}{" "}
              <span className="text-destructive">*</span>
            </Label>
            <Input
              ref={usernameRef}
              id="username"
              name="username"
              placeholder="your.email@example.com"
              value={formData.username}
              onChange={handleChange}
              required
              aria-invalid={Boolean(fieldErrors.username)}
              aria-describedby={
                fieldErrors.username ? "username-error" : undefined
              }
            />
            {fieldErrors.username && (
              <p id="username-error" className="mt-1 text-sm text-destructive">
                {fieldErrors.username}
              </p>
            )}
            <p className="mt-1 text-sm text-muted-foreground">
              {isApple
                ? "Use the email address you sign into iCloud with."
                : "For Fastmail: use your full email address."}
            </p>
          </fieldset>

          <fieldset className="mb-4">
            <Label
              className="mb-2.5 text-[15px] leading-normal"
              htmlFor="password"
            >
              {isApple ? "App-specific password" : "Password"}{" "}
              <span className="text-destructive">*</span>
            </Label>
            <Input
              ref={passwordRef}
              id="password"
              name="password"
              type="password"
              placeholder="••••••••"
              value={formData.password}
              onChange={handleChange}
              required
              aria-invalid={Boolean(fieldErrors.password)}
              aria-describedby={
                fieldErrors.password ? "password-error" : undefined
              }
            />
            {fieldErrors.password && (
              <p id="password-error" className="mt-1 text-sm text-destructive">
                {fieldErrors.password}
              </p>
            )}
            <p className="mt-1 text-sm text-muted-foreground">
              {isApple
                ? "Paste the password generated by Apple, not your regular password."
                : "Use an app-specific password when your provider supports one."}
            </p>
          </fieldset>

          {!isApple && (
            <fieldset className="mb-4">
              <Label
                className="mb-2.5 text-[15px] leading-normal"
                htmlFor="path"
              >
                Path (Optional)
              </Label>
              <Input
                id="path"
                name="path"
                placeholder="/dav/calendars/user/username@fastmail.com"
                value={formData.path}
                onChange={handleChange}
              />
              <p className="mt-1 text-sm text-muted-foreground">
                For Fastmail: /dav/calendars/user/youremail@fastmail.com
              </p>
            </fieldset>
          )}

          <div className="mt-4">
            <Button
              type="button"
              variant="outline"
              onClick={handleTest}
              disabled={isTesting || isSubmitting}
              className="w-full"
            >
              {isTesting ? "Testing Connection..." : "Test Connection"}
            </Button>
          </div>

          {renderTestResults()}
        </CardContent>

        <CardFooter className="flex justify-between">
          <Button
            type="button"
            variant="outline"
            onClick={onCancel}
            disabled={isSubmitting || isTesting}
          >
            Cancel
          </Button>
          <Button type="submit" disabled={isSubmitting || isTesting}>
            {isSubmitting ? "Connecting..." : "Connect"}
          </Button>
        </CardFooter>
      </form>
    </Card>
  );
}
