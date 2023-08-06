import { NoteDisplay } from "@components/server";
import { NoteInput } from "@components/client";
import styles from "@/app/Page.module.css";
import { serialize } from "@/lib/db";
import Source from "@models/Source";
import Note from "@models/Note";

export default async function NotePage() {
    const sources = serialize(await Source.find());
    const notes = serialize(await Note.find());

    return (
        <main className={styles.main}>
            <h2>Notes</h2>

            {notes.length > 0 && (
                <section>
                    <h3>Your notes</h3>

                    <ol className={styles.listGrid}>
                        {notes.map((note) => (
                            <li key={note.id}>
                                <NoteDisplay note={note} />
                            </li>
                        ))}
                    </ol>
                </section>
            )}

            <section>
                <h3>Create new note</h3>
                <NoteInput availableSources={sources} />
            </section>
        </main>
    );
}