import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "../utils/supabase-client";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useAuth } from "../utils/auth-context";

function Login({ className, ...props }) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  // Suivre si la largeur d'écran est lg (1024px) ou plus
  const [isLargeScreen, setIsLargeScreen] = useState(window.innerWidth >= 1024);
  const navigate = useNavigate();
  const { user } = useAuth();

  useEffect(() => {
    if (window.location.hash) {
      window.history.replaceState({}, document.title, window.location.pathname);
    }
  }, []);

  useEffect(() => {
    if (user) {
      navigate("/home");
    }
  }, [user, navigate]);

  // Écoute des événements de redimensionnement de la fenêtre pour mettre à jour dynamiquement l'arrière-plan
  useEffect(() => {
    const handleResize = () => {
      setIsLargeScreen(window.innerWidth >= 1024);
    };

    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        setError(error.message);
        return;
      }

      navigate("/home");
    } catch (err) {
      setError("Une erreur est survenue lors de la connexion.");
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleLogin = async () => {
    const { error } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: { redirectTo: `${window.location.origin}/home` },
    });
    if (error) setError("La connexion avec Google a échoué");
  };

  return (
    <div
      className={cn(
        "flex h-screen w-full flex-col lg:flex-row items-center justify-center relative",
        className
      )}
      {...props}
    >
      {/* Partie gauche : image affichée uniquement sur les grands écrans */}
      <div
        className="hidden lg:block lg:w-1/2 h-screen bg-cover bg-center"
        style={{
          backgroundImage:
            "url(/Login_image.jpg)",
        }}
      ></div>

      {/* Partie droite : formulaire de connexion avec arrière-plan conditionnel */}
      <div
        className="w-full lg:w-1/2 flex justify-center items-center px-6 lg:px-0 h-screen transition-all duration-300"
        style={{
          backgroundImage: !isLargeScreen
            ? "url(/Login_image.jpg)"
            : "none",
          backgroundColor: isLargeScreen ? "#111827" : "transparent",
          backgroundSize: "cover",
          backgroundPosition: "center",
          backgroundRepeat: "no-repeat",
        }}
      >
        <Card className="w-full max-w-md bg-white shadow-lg p-6 lg:p-8 rounded-lg">
          <CardHeader>
            <div className="flex justify-center">
              <img src="/Vertex_logo.png" alt="Logo" className="w-35  mb-4" />
            </div>
            <CardTitle className="text-2xl text-center">Connexion</CardTitle>
            <CardDescription className="text-center">
              Entrez votre adresse e-mail ci-dessous pour vous connecter à votre compte
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleLogin} className="space-y-6">
              <div className="grid gap-2">
                <Label htmlFor="email">Adresse e-mail</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="m@example.com"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />
              </div>
              <div className="grid gap-2">
                <div className="flex items-center justify-between">
                  <Label htmlFor="password">Mot de passe</Label>
                </div>
                <Input
                  id="password"
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                />
              </div>
              {error && <p className="text-red-500 text-sm">{error}</p>}
              <Button type="submit" className="w-full" disabled={loading}>
                {loading ? "Connexion en cours..." : "Connexion"}
              </Button>
              <Button
                type="button"
                variant="outline"
                className="w-full"
                onClick={handleGoogleLogin}
              >
                Se connecter avec Google
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

export default Login;
