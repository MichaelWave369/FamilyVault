import { createContext, useContext, useState } from 'react';
const Ctx=createContext<any>(null); export const useAuth=()=>useContext(Ctx);
export function AuthProvider({children}:{children:React.ReactNode}){const [user,setUser]=useState<any>(null);return <Ctx.Provider value={{user,setUser}}>{children}</Ctx.Provider>}
