import { createContext, useContext, useEffect, useState } from "react";
import { supabase } from "@/features/auth/utils/supabase-client";
import { useNavigate } from "react-router-dom";

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);  // Store the authenticated user
  const [role, setRole] = useState(null);  // Store the user's role
  const [site, setSite] = useState(null);  // Store the user's site
  const [entreprise, setEntreprise] = useState(null);  // Store the user's entreprise


  const [loading, setLoading] = useState(true); // Track loading state
  const navigate = useNavigate();

  useEffect(() => {
    // Function to fetch the authenticated user from Supabase
    const fetchUser = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      setUser(user); // Set the user state
      if (user) {
        await fetchUserRole(user.id); // Fetch the user's role if logged in
      }
      setLoading(false); // Stop loading once the user is fetched
    };

    // Function to fetch the user's role from the database
    const fetchUserRole = async (userId) => {
      const { data, error } = await supabase
        .from("profiles")  // Select from the user_roles table
        .select("roles(name) , sites(id , name, site_password) , entreprises(id , name)") // Get the role name from the roles table
        .eq("id", userId) // Filter by the current user
        .single(); // Expect only one result

      if (data) {
      setRole(data.roles.name);
      setSite(data.sites); 
      setEntreprise(data.entreprises);
     }

      console.log("hhhhhhhhhhhhhhhhhh" + JSON.stringify(data))
    };

    fetchUser(); // Call fetchUser on component mount

    // Listen for authentication state changes (login, logout)
    const { data: authListener } = supabase.auth.onAuthStateChange((event, session) => {
      setUser(session?.user || null); // Update the user state
      if (session?.user) {
        fetchUserRole(session.user.id); // Fetch role on login
      } else {
        setRole(null);
        setSite(null);
        setEntreprise(null); // Reset role and site on logout
      }
      if (event === "SIGNED_OUT") {
        navigate("/login"); // Redirect to login if user signs out
      }
    });

    return () => authListener.subscription.unsubscribe(); // Cleanup listener on unmount
  }, [navigate]);

  // Provide user and role states to the app
  const value = { user, role, site, entreprise ,loading };

  return <AuthContext.Provider value={value}>{!loading && children}</AuthContext.Provider>;
};

export const useAuth = () => useContext(AuthContext); // Custom hook to access auth context
