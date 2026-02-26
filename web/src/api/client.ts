const API = import.meta.env.VITE_API_URL || 'http://localhost:8000';
let accessToken = localStorage.getItem('access_token') || '';
const refresh = ()=>localStorage.getItem('refresh_token') || '';
export const setTokens=(a:string,r:string)=>{accessToken=a;localStorage.setItem('access_token',a);localStorage.setItem('refresh_token',r)};
export const clearTokens=()=>{accessToken='';localStorage.removeItem('access_token');localStorage.removeItem('refresh_token')}
export async function api(path:string, options:RequestInit={}, retry=true){
  const res = await fetch(`${API}${path}`, { ...options, headers:{'Content-Type':'application/json', Authorization: accessToken?`Bearer ${accessToken}`:'', ...(options.headers||{})}})
  if(res.status===401 && retry && refresh()){
    const r = await fetch(`${API}/api/auth/refresh`, {method:'POST', headers:{'Content-Type':'application/json'}, body: JSON.stringify({refresh_token: refresh()})}).then(x=>x.json())
    if(r.access_token){setTokens(r.access_token,r.refresh_token);return api(path,options,false)}
  }
  if(!res.ok) throw new Error(await res.text())
  return res.json()
}
