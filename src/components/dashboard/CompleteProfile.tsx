import React from "react";
import EditProfile from "./EditProfile";

interface CompleteProfileProps {
  token: string;
  user: any;
  onLogout: () => void;
  onComplete?: (updatedUser: any) => void;
  onUpdateComplete?: (updatedUser: any) => void;
  setCurrentPath: (path: string) => void;
  theme?: any;
  setTheme?: (theme: any) => void;
}

export default function CompleteProfile(props: CompleteProfileProps) {
  const handleUpdate = (updatedUser: any) => {
    if (props.onComplete) props.onComplete(updatedUser);
    if (props.onUpdateComplete) props.onUpdateComplete(updatedUser);
  };

  return <EditProfile {...props} onUpdateComplete={handleUpdate} />;
}
