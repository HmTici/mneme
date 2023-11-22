import { UserCard } from "@components/server";
import styles from "@/app/page.module.css";
import { redirect } from "next/navigation";
import { serialize, serializeOne } from "@/lib/db";
import { useUser } from "@/lib/auth";
import { cookies } from "next/headers";
// import { Group, Quiz, Note, Source } from "@mneme_app/database-models";
import { Source, Note, Quiz, Group } from "@/app/api/models";
import {
    QuizDisplay,
    NoteDisplay,
    SourceDisplay,
} from "@/app/components/server";
import InviteUser from "@/app/components/notification/inviteUser";

export default async function GroupPage({ params }) {
    const groupId = params.groupId;
    console.log(groupId);

    const group = serializeOne(await Group.findById(groupId).populate("users"));
    if (!group) return redirect("/groups");

    const user = serializeOne(
        await useUser({ token: cookies().get("token")?.value }),
    );
    if (!group.isPublic && !user?.groups?.includes(groupId)) {
        return redirect("/groups");
    }

    const permissionsQuery = {
        $or: [
            { "permissions.groupsRead": { $in: [group._id] } },
            { "permissions.groupsWrite": { $in: [group._id] } },
        ],
    };

    const quizzes = serialize(await Quiz.find(permissionsQuery));
    const notes = serialize(await Note.find(permissionsQuery));
    const sources = serialize(await Source.find(permissionsQuery));

    return (
        <main className={styles.main}>
            <section>
                <h2>{group.name}</h2>
                <div className="paragraph center">
                    <p title="Group description">{group.description}</p>
                </div>
            </section>

            <section>
                <h3>Members</h3>

                <div className="paragraph">
                    <p>
                        All members are able to associate resources (Quiz
                        questions, Notes, and Sources) with the group.
                        <br />
                        Some resources will be restricted to admins.
                    </p>
                </div>

                <div>
                    {group.users.length > 0 && (
                        <ol className={styles.listGrid}>
                            {group.users.map((user) => {
                                return (
                                    <li key={user._id}>
                                        <UserCard
                                            user={user}
                                            isOwner={user._id === group.owner}
                                            isAdmin={group.admins.includes(
                                                user._id,
                                            )}
                                        />
                                    </li>
                                );
                            })}
                        </ol>
                    )}
                </div>

                {user &&
                    (user._id === group.owner ||
                        group.admins.includes(user._id)) && (
                        <InviteUser groupId={groupId} />
                    )}
            </section>

            <section>
                <h3>Quiz Questions</h3>
                {quizzes.length > 0 ? (
                    <ol className={styles.listGrid}>
                        {quizzes.map((quiz) => (
                            <QuizDisplay key={quiz._id} quiz={quiz} />
                        ))}
                    </ol>
                ) : (
                    <div className="paragraph">
                        <p>No quiz questions are associated with this group</p>
                    </div>
                )}
            </section>

            <section>
                <h3>Notes</h3>
                {notes.length > 0 ? (
                    <ol className={styles.listGrid}>
                        {notes.map((note) => (
                            <NoteDisplay key={note._id} note={note} />
                        ))}
                    </ol>
                ) : (
                    <div className="paragraph">
                        <p>No notes are associated with this group</p>
                    </div>
                )}
            </section>

            <section>
                <h3>Sources</h3>
                {sources.length > 0 ? (
                    <ol className={styles.listGrid}>
                        {sources.map((source) => (
                            <SourceDisplay key={source._id} source={source} />
                        ))}
                    </ol>
                ) : (
                    <div className="paragraph">
                        <p>No sources are associated with this group</p>
                    </div>
                )}
            </section>
        </main>
    );
}
