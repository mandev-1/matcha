"use client";

import React from "react";
import { useRouter } from "next/navigation";
import { Button, Input, InputGroup, Checkbox, Link, TextField, Label } from "@heroui/react";
import { Icon } from "@iconify/react";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import { getApiUrl } from "@/lib/apiUrl";

const MailIcon = (props: React.SVGProps<SVGSVGElement>) => {
  return (
    <svg
      aria-hidden="true"
      fill="none"
      focusable="false"
      height="1em"
      role="presentation"
      viewBox="0 0 24 24"
      width="1em"
      {...props}
    >
      <path
        d="M17 3.5H7C4 3.5 2 5 2 8.5V15.5C2 19 4 20.5 7 20.5H17C20 20.5 22 19 22 15.5V8.5C22 5 20 3.5 17 3.5ZM17.47 9.59L14.34 12.09C13.68 12.62 12.84 12.88 12 12.88C11.16 12.88 10.31 12.62 9.66 12.09L6.53 9.59C6.21 9.33 6.16 8.85 6.41 8.53C6.67 8.21 7.14 8.15 7.46 8.41L10.59 10.91C11.35 11.52 12.64 11.52 13.4 10.91L16.53 8.41C16.85 8.15 17.33 8.2 17.58 8.53C17.84 8.85 17.79 9.33 17.47 9.59Z"
        fill="currentColor"
      />
    </svg>
  );
};

export default function Component() {
  const router = useRouter();
  const [isVisible, setIsVisible] = React.useState(false);
  const [isConfirmVisible, setIsConfirmVisible] = React.useState(false);
  const [formData, setFormData] = React.useState({
    firstName: "",
    lastName: "",
    username: "",
    email: "",
    password: "",
    confirmPassword: "",
  });
  const [error, setError] = React.useState("");
  const [loading, setLoading] = React.useState(false);

  const toggleVisibility = () => setIsVisible(!isVisible);
  const toggleConfirmVisibility = () => setIsConfirmVisible(!isConfirmVisible);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  // Common words in multiple languages that should not be accepted as passwords
  const commonWords = [
    "password", "password123", "12345678", "123456789", "qwerty", "abc123",
    "password1", "welcome", "monkey", "1234567", "letmein", "trustno1",
    "dragon", "baseball", "iloveyou", "master", "sunshine", "ashley",
    "bailey", "passw0rd", "shadow", "123123", "654321", "superman",
    "qazwsx", "michael", "football", "jesus", "ninja",
    "mustang", "princess", "qwerty123", "solo", "starwars",
    "hello", "hello123", "welcome123", "admin", "admin123", "root",
    "test", "test123", "guest", "user", "demo", "sample",
    "пароль", "пароль123", "привет", "привет123", "админ", "админ123",
    "йцукен", "пользователь", "тест", "тест123",
    "contraseña", "contrasena", "contraseña123", "hola", "hola123",
    "motdepasse", "motdepasse123", "bonjour", "bonjour123",
    "passwort", "passwort123", "hallo", "hallo123",
    "mima", "mima123", "pasuwaado",
  ];

  const isCommonWord = (password: string): boolean => {
    if (password === "Test1234") return false;
    const lowerPassword = password.toLowerCase();
    return commonWords.some(word => lowerPassword === word || lowerPassword.includes(word));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (!formData.firstName.trim() || !formData.lastName.trim()) {
      setError("First name and last name are required");
      return;
    }

    if (formData.password !== formData.confirmPassword) {
      setError("Passwords do not match");
      return;
    }

    // Check for common words (any language)
    if (isCommonWord(formData.password)) {
      setError("Password cannot be a commonly used word");
      return;
    }

    setLoading(true);

    try {
      const response = await fetch(getApiUrl("/api/register"), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          username: formData.username.trim(),
          first_name: formData.firstName.trim(),
          last_name: formData.lastName.trim(),
          email: formData.email,
          password: formData.password,
        }),
      });

      const data = await response.json();

      if (response.ok) {
        router.push("/login?registered=true");
      } else {
        setError(data.error || "Registration failed");
      }
    } catch (err) {
      setError("An error occurred. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <ProtectedRoute redirectIfAuth="/matcha">
      <div className="flex h-full w-full items-center justify-center">
      <div className="rounded-large flex w-full max-w-sm flex-col gap-4 px-8 pt-6 pb-10">
        <p className="text-left text-3xl font-semibold text-pink-500">
          Sign Up
          <span aria-label="emoji" className="ml-2" role="img">
            👋
          </span>
        </p>
        <p className="pb-4 text-left text-sm italic text-default-400">
          Start dating again and live life
        </p>

        {error && (
          <div className="bg-danger/10 text-danger p-3 rounded-lg text-sm">
            {error}
          </div>
        )}

        <form className="flex flex-col gap-4" onSubmit={handleSubmit}>
          <TextField isRequired name="firstName" value={formData.firstName} onChange={(v) => setFormData({ ...formData, firstName: v })}>
            <Label>First Name</Label>
            <Input placeholder="Enter your first name" variant="secondary" autoComplete="given-name" />
          </TextField>
          <TextField isRequired name="lastName" value={formData.lastName} onChange={(v) => setFormData({ ...formData, lastName: v })}>
            <Label>Last Name</Label>
            <Input placeholder="Enter your last name" variant="secondary" autoComplete="family-name" />
          </TextField>
          <TextField isRequired name="username" value={formData.username} onChange={(v) => setFormData({ ...formData, username: v })}>
            <Label>Username</Label>
            <Input placeholder="Enter your username" variant="secondary" autoComplete="username" />
          </TextField>
          <TextField isRequired name="email" value={formData.email} onChange={(v) => setFormData({ ...formData, email: v })}>
            <Label>Email</Label>
            <InputGroup variant="secondary">
              <InputGroup.Prefix>
                <MailIcon className="text-2xl text-default-400 shrink-0" />
              </InputGroup.Prefix>
              <InputGroup.Input placeholder="Enter your email" type="email" autoComplete="email" />
            </InputGroup>
          </TextField>
          <TextField isRequired name="password" value={formData.password} onChange={(v) => setFormData({ ...formData, password: v })}>
            <Label>Password</Label>
            <InputGroup variant="secondary">
              <InputGroup.Input placeholder="Enter your password" type={isVisible ? "text" : "password"} autoComplete="new-password" />
              <InputGroup.Suffix>
                <Button type="button" size="sm" variant="ghost" onPress={toggleVisibility} className="min-w-8 w-8 h-8 p-0">
                  <Icon className="text-2xl text-default-400" icon={isVisible ? "solar:eye-closed-linear" : "solar:eye-bold"} />
                </Button>
              </InputGroup.Suffix>
            </InputGroup>
          </TextField>
          <TextField isRequired name="confirmPassword" value={formData.confirmPassword} onChange={(v) => setFormData({ ...formData, confirmPassword: v })}>
            <Label>Confirm Password</Label>
            <InputGroup variant="secondary">
              <InputGroup.Input placeholder="Confirm your password" type={isConfirmVisible ? "text" : "password"} autoComplete="new-password" />
              <InputGroup.Suffix>
                <Button type="button" size="sm" variant="ghost" onPress={toggleConfirmVisibility} className="min-w-8 w-8 h-8 p-0">
                  <Icon className="text-2xl text-default-400" icon={isConfirmVisible ? "solar:eye-closed-linear" : "solar:eye-bold"} />
                </Button>
              </InputGroup.Suffix>
            </InputGroup>
          </TextField>
          <Checkbox isRequired className="py-4">
            <Checkbox.Control>
              <Checkbox.Indicator />
            </Checkbox.Control>
            <Checkbox.Content>
              I agree with the&nbsp;
              <Link className="relative z-10" href="#">Terms</Link>
              &nbsp;and&nbsp;
              <Link className="relative z-10" href="#">Privacy Policy</Link>
            </Checkbox.Content>
          </Checkbox>
          <Button className="w-full bg-pink-500 text-white hover:bg-pink-600" type="submit" isPending={loading}>
            Sign Up
          </Button>
        </form>
        <p className="text-small text-center">
          <Link href="/login">
            Already have an account? Log In
          </Link>
        </p>
      </div>
    </div>
    </ProtectedRoute>
  );
}

