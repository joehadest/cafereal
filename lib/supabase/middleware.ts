import { createServerClient } from "@supabase/ssr"
import { NextResponse, type NextRequest } from "next/server"

export async function updateSession(request: NextRequest) {
  let supabaseResponse = NextResponse.next({
    request,
  })

  // With Fluid compute, don't put this client in a global environment
  // variable. Always create a new one on each request.
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

  if (!supabaseUrl || !supabaseAnonKey) {
    console.error("[v0] Missing Supabase environment variables")
    return supabaseResponse
  }

  const supabase = createServerClient(supabaseUrl, supabaseAnonKey, {
    cookies: {
      getAll() {
        return request.cookies.getAll()
      },
      setAll(cookiesToSet) {
        cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value))
        supabaseResponse = NextResponse.next({
          request,
        })
        cookiesToSet.forEach(({ name, value, options }) => {
          // Configura opções de cookie para garantir persistência da sessão
          const cookieOptions = {
            ...options,
            // Garantir SameSite para compatibilidade
            sameSite: (options?.sameSite as "lax" | "strict" | "none") || "lax",
            // Secure apenas em produção
            secure: options?.secure ?? (process.env.NODE_ENV === "production"),
            // Manter httpOnly para cookies de autenticação
            httpOnly: options?.httpOnly ?? (name.includes("auth-token") || name.includes("sb-")),
            // Se não houver maxAge definido e for cookie de refresh, definir expiração longa
            maxAge: options?.maxAge ?? (name.includes("refresh") ? 60 * 60 * 24 * 365 : undefined),
          }
          supabaseResponse.cookies.set(name, value, cookieOptions)
        })
      },
    },
  })

  // Do not run code between createServerClient and
  // supabase.auth.getUser(). A simple mistake could make it very hard to debug
  // issues with users being randomly logged out.

  // IMPORTANT: If you remove getUser() and you use server-side rendering
  // with the Supabase client, your users may be randomly logged out.
  const {
    data: { user },
  } = await supabase.auth.getUser()

  // Verifica acesso ao painel admin
  if (request.nextUrl.pathname.startsWith("/admin")) {
    if (!user) {
    const url = request.nextUrl.clone()
    url.pathname = "/auth/login"
    return NextResponse.redirect(url)
    }

    // Verifica se o usuário é um cliente (está na tabela customer_profiles)
    // Se for cliente, não pode acessar o admin
    const { data: customerProfile } = await supabase
      .from("customer_profiles")
      .select("id")
      .eq("user_id", user.id)
      .maybeSingle()

    if (customerProfile) {
      // Usuário é um cliente, redireciona para a página inicial
      const url = request.nextUrl.clone()
      url.pathname = "/"
      return NextResponse.redirect(url)
    }
  }

  // IMPORTANT: You *must* return the supabaseResponse object as it is.
  // If you're creating a new response object with NextResponse.next() make sure to:
  // 1. Pass the request in it, like so:
  //    const myNewResponse = NextResponse.next({ request })
  // 2. Copy over the cookies, like so:
  //    myNewResponse.cookies.setAll(supabaseResponse.cookies.getAll())
  // 3. Change the myNewResponse object to fit your needs, but avoid changing
  //    the cookies!
  // 4. Finally:
  //    return myNewResponse
  // If this is not done, you may be causing the browser and server to go out
  // of sync and terminate the user's session prematurely!

  return supabaseResponse
}
