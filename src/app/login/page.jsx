import { LoginForm } from "@/components/login-form"

export default function Page() {
  return (
    (<div className="flex min-h-screen w-full items-center justify-center p-4 sm:p-6 md:p-10 bg-gradient-to-br from-blue-50 to-indigo-100">
      <div className="w-full max-w-sm sm:max-w-md">
        <LoginForm />
      </div>
    </div>)
  );
}
