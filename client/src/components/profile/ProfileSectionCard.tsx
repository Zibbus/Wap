// client/src/components/profile/ProfileSectionCard.tsx
import type { ReactNode } from "react";

type ProfileSectionCardProps = {
  title: string;
  editMode: boolean;
  children: ReactNode;
};

export function ProfileSectionCard({ title, editMode, children }: ProfileSectionCardProps) {
  return (
    <section className="mt-6 bg-white rounded-2xl shadow-sm p-6 dark:bg-gray-900 dark:border dark:border-gray-800">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold text-gray-800 dark:text-gray-100">
          {title}
        </h2>
        {!editMode ? (
          <span className="text-xs text-gray-500">Modo lettura</span>
        ) : (
          <span className="text-xs text-indigo-700">In modifica</span>
        )}
      </div>

      {children}
    </section>
  );
}
