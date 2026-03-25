import { useEffect } from "react"

export default function ResetLogin() {
    useEffect(()=>{
        localStorage.removeItem('pppzcm-dorothy-token');
        window.location.href = '/login';
    },[])

    return <>limpando dados do usuário...</>
}