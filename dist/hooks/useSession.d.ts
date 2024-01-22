import { Auth, User } from 'firebase/auth';
type Controls = 'add' | 'update' | 'delete';
type Session = {
    activeUid: string | null;
    members: string[];
};
export declare const useSession: (auth: Auth) => [Session | null, (type: Controls, uid: string) => void, User | null | undefined];
export {};
