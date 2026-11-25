import { User, UserShield, UserStar } from "lucide-react";
import { roleLabels } from "../lib/labels";

export default function UserBadge({user}){
    return(
        <span
            title={user.is_admin ? 'Administrateur' : roleLabels[user.role]}
            className={`flex size-8 shrink-0 items-center justify-center rounded-xl ${
            user.is_admin
                ? 'bg-amber-100 text-amber-700'
                : user.role === 'manager'
                ? 'bg-brand-50 text-brand-600'
                : 'bg-gray-100 text-ink'
            }`}
        >
            {user.is_admin ? (
            <UserShield size={16} aria-hidden="true" />
            ) : user.role === 'manager' ? (
            <UserStar size={16} aria-hidden="true" />
            ) : (
            <User size={16} aria-hidden="true" />
            )}
        </span>
    )
}