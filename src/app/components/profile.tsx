'use client'
import { useSession } from "next-auth/react"

export default function Profile() {
  const session = useSession();

  if (session.data?.user) {
    return (
      <div>
        <h1 className="text-4xl">Profile</h1>
        <div>From client:</div>
        <pre>{JSON.stringify(session.data.user, null, 2)}</pre>
      </div>
    )
  }

  return (
    <div>From client: user is not sign in</div>
  )

}