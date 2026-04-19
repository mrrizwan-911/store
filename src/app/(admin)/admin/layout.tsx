import { cookies } from 'next/headers'
import { redirect } from 'next/navigation'
import { verifyRefreshToken } from '@/lib/auth/jwt'
import { AdminSidebar } from '@/components/admin/AdminSidebar'

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const cookieStore = await cookies()
  const token = cookieStore.get('refreshToken')?.value

  if (!token) {
    redirect('/login')
  }

  try {
    const payload = verifyRefreshToken(token)
    if (payload.role !== 'ADMIN') {
      redirect('/login')
    }
  } catch (error) {
    console.error("JWT ERROR IN LAYOUT:", error)
    redirect('/login')
  }

  return (
    <div className="flex h-screen bg-white text-black font-sans selection:bg-black selection:text-white overflow-hidden">
      <AdminSidebar />
      <main className="flex-1 overflow-y-auto p-8 bg-neutral-50">
        <div className="max-w-6xl mx-auto">
          {children}
        </div>
      </main>
    </div>
  )
}
