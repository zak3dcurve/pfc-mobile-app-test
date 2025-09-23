import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/features/auth/utils/supabase-client";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { useAuth } from "@/features/auth/utils/auth-context";
import Navbar from "@/components/app-navbar";




export const LoadingSpinner = ({className}) => {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="30"
      height="30"
      viewBox="0 0 24 24"
      fill="none"
      stroke="black" // Changed stroke to "black"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={cn("animate-spin", className)}
    >
      <path d="M21 12a9 9 0 1 1-6.219-8.56" />
    </svg>
  );
}

function ProfilePage({ className, ...props }) {
  const navigate = useNavigate();
  const { user, loading, role , site, entreprise} = useAuth();

  // useEffect(() => {
  //   if (!loading && !user) {
  //     navigate("/login");
  //   }
  // }, [user, loading, navigate]);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    navigate("/login");
  };

  if (!role) {
    return (
      <div
       
      >
        {/* Optional: You can add a spinner or a loading text here */}
        <div className={cn("flex flex-row items-center gap-2", className)} {...props}>
        <LoadingSpinner /> <h4>Loading...</h4>
        </div>
      </div>
    );
  }

  if (!user) {
    return null; // You can return null or redirect to login if no user
  }

  return (
    <>
      <Navbar />
      <div className={cn("flex items-center justify-center min-h-screen bg-gray-50 p-4 pt-20", className)} {...props}>
        <Card className="w-full max-w-md shadow-lg border-0">
          <CardHeader className="text-center pb-4">
            <div className="w-20 h-20 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-10 h-10 text-blue-600" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" clipRule="evenodd" />
              </svg>
            </div>
            <CardTitle className="text-2xl font-bold text-gray-900">Bonjour!</CardTitle>
            <CardDescription className="text-gray-600">{user?.email || "User"}</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-3">
              <div className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                <span className="font-medium text-gray-700">Rôle:</span>
                <span className="text-gray-900">{role}</span>
              </div>
              {site && (
                <div className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                  <span className="font-medium text-gray-700">Site:</span>
                  <span className="text-gray-900">{site.name}</span>
                </div>
              )}
              {entreprise && (
                <div className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                  <span className="font-medium text-gray-700">Entreprise:</span>
                  <span className="text-gray-900">{entreprise.name}</span>
                </div>
              )}
            </div>
            <Button
              onClick={handleLogout}
              className="w-full h-12 bg-red-600 hover:bg-red-700 text-white font-semibold transition-colors"
            >
              Se déconnecter
            </Button>
          </CardContent>
        </Card>
      </div>
    </>
  );
}

export default ProfilePage;
