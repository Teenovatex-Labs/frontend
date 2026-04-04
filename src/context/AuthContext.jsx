import { useState, useEffect } from "react";
import { AuthContext } from "./CreateContext";

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  //Simulate fetching user data from an API(replace with real API later)

  useEffect(() => {
    const fetchUser = async () => {
      try {
        // const res = await usersApi.getProfile();
        // setUser(res.data);

        //TEMP USER
        setUser({ name: "John Doe", email: "john.doe@example.com" });
      } catch (error) {
        console.error("Error fetching user:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchUser();
  }, []);

  return (
    <AuthContext.Provider value={{ user, loading }}>
      {children}
    </AuthContext.Provider>
  );
};
