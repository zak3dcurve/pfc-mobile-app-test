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
    

    <div className={cn("flex items-center justify-center h-screen bg-gray-100", className)} {...props}>
      <Card className="w-full max-w-md ">
        <CardHeader>
          <CardTitle className="text-2xl">Bonjour, {user?.email || "User"}!</CardTitle>
          <CardDescription>Vous êtes connecté à votre compte</CardDescription>
          <CardDescription>Votre role est {role}</CardDescription>
          <CardDescription>Votre site est {site?.name}</CardDescription>
          <CardDescription>Votre entreprise est {entreprise?.name}</CardDescription>


        </CardHeader>
        <CardContent>
          <Button onClick={handleLogout} className="w-full">
            Logout
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}

export default ProfilePage;
