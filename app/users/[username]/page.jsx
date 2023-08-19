import styles from "@/app/page.module.css";
import { redirect } from "next/navigation";
import { useUser } from "@/lib/auth";
import { serializeOne } from "@/lib/db";

export default async function UserPage({ params: { username } }) {
    const user = await useUser();

    if (!user) return redirect("/login");
    if (user.username === username) return redirect("/me/dashboard");

    const profile = serializeOne(await useUser({ username }));

    return (
        <main className={styles.main}>
            <h2>Profile</h2>

            <section>
                <div className="paragraph">
                    {profile ? (
                        <>
                            <h3>{profile.username}'s profile</h3>

                            <p>
                                Username: {profile.username}
                                <br />
                                Joined:{" "}
                                {new Intl.DateTimeFormat("en-US", {
                                    dateStyle: "long",
                                    timeStyle: "short",
                                }).format(new Date(profile.createdAt))}
                            </p>
                        </>
                    ) : (
                        <>
                            <h3>404</h3>
                            <p>Profile not found</p>
                        </>
                    )}
                </div>
            </section>
        </main>
    );
}