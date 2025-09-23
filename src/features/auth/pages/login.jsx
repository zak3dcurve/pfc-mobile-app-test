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
import { useIsMobile } from "@/hooks/use-mobile";

function Login({ className, ...props }) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const isMobile = useIsMobile();
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
        <Card className="w-full max-w-md bg-white/95 backdrop-blur-sm shadow-xl p-4 sm:p-6 lg:p-8 rounded-xl border-0">
          <CardHeader className="space-y-4">
            <div className="flex justify-center">
              <img src="/Vertex_logo.png" alt="Logo" className="w-28 sm:w-32 lg:w-35 mb-2" />
            </div>
            <CardTitle className="text-2xl sm:text-3xl text-center font-bold text-gray-900">Connexion</CardTitle>
            <CardDescription className="text-center text-gray-600 text-sm sm:text-base">
              Entrez votre adresse e-mail ci-dessous pour vous connecter à votre compte
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleLogin} className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="email" className="text-sm font-medium text-gray-700">Adresse e-mail</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="m@example.com"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="h-12 text-base px-4 border-gray-300 focus:border-blue-500 focus:ring-blue-500"
                />
              </div>
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label htmlFor="password" className="text-sm font-medium text-gray-700">Mot de passe</Label>
                </div>
                <Input
                  id="password"
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="h-12 text-base px-4 border-gray-300 focus:border-blue-500 focus:ring-blue-500"
                />
              </div>
              {error && (
                <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
                  <p className="text-red-700 text-sm text-center">{error}</p>
                </div>
              )}
              <div className="space-y-3">
                <Button
                  type="submit"
                  className="w-full h-12 text-base font-semibold bg-blue-600 hover:bg-blue-700 focus:ring-4 focus:ring-blue-200 transition-all duration-200"
                  disabled={loading}
                >
                  {loading ? (
                    <div className="flex items-center justify-center space-x-2">
                      <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent"></div>
                      <span>Connexion en cours...</span>
                    </div>
                  ) : (
                    "Connexion"
                  )}
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  className="w-full h-12 text-base font-medium border-gray-300 hover:bg-gray-50 focus:ring-4 focus:ring-gray-200 transition-all duration-200"
                  onClick={handleGoogleLogin}
                  disabled={loading}
                >
                  <div className="flex items-center justify-center space-x-2">
                    <svg className="w-5 h-5" viewBox="0 0 24 24">
                      <path fill="currentColor" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                      <path fill="currentColor" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                      <path fill="currentColor" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                      <path fill="currentColor" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                    </svg>
                    <span>Se connecter avec Google</span>
                  </div>
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

export default Login;
