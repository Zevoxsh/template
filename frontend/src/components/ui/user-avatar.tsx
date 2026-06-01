"use client";

import { useState, useEffect } from "react";
import { cn } from "@/lib/utils";

async function gravatarUrl(email: string, size: number): Promise<string> {
  const encoded = new TextEncoder().encode(email.trim().toLowerCase());
  const hashBuffer = await crypto.subtle.digest("SHA-256", encoded);
  const hex = Array.from(new Uint8Array(hashBuffer)).map(b => b.toString(16).padStart(2, "0")).join("");
  return `https://www.gravatar.com/avatar/${hex}?s=${size}&d=mp`;
}

interface UserAvatarProps {
  name: string;
  email: string;
  avatarUrl?: string | null;
  size?: "sm" | "md" | "lg";
  className?: string;
}

const SIZE = { sm: "h-7 w-7 text-xs", md: "h-9 w-9 text-sm", lg: "h-20 w-20 text-2xl" };
const PX  = { sm: 28, md: 36, lg: 200 };

export function UserAvatar({ name, email, avatarUrl, size = "md", className }: UserAvatarProps) {
  const [gravatar, setGravatar] = useState<string | null>(null);

  useEffect(() => {
    if (!avatarUrl && email) gravatarUrl(email, PX[size]).then(setGravatar);
  }, [email, avatarUrl, size]);

  const src = avatarUrl ?? gravatar;
  const initials = name.split(" ").map(w => w[0]).join("").toUpperCase().slice(0, 2);

  return (
    <span className={cn(
      "rounded-full overflow-hidden bg-indigo-100 text-indigo-700 font-bold flex items-center justify-center shrink-0",
      SIZE[size],
      className
    )}>
      {src
        ? <img src={src} alt={name} className="h-full w-full object-cover" />
        : initials
      }
    </span>
  );
}
