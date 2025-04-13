import { auth, db } from "@/firebaseConfig";
import { doc, getDoc } from "firebase/firestore";

export async function getCurrentUser() {
  const user = auth.currentUser;
  if (!user) return null;

  // Fetch additional user data from Firestore
  const userDoc = await getDoc(doc(db, "users", user.uid));
  if (userDoc.exists()) {
    return {
      uid: user.uid,
      email: user.email,
      ...userDoc.data()
    };
  }
  return {
    uid: user.uid,
    email: user.email
  };
}