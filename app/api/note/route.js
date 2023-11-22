import { NextResponse } from "next/server";
import { canEdit, queryReadableResources, useUser } from "@/lib/auth";
import { cookies } from "next/headers";
// import { Note } from "@mneme_app/database-models";
import { Note } from "@/app/api/models";
import { server, unauthorized } from "@/lib/apiErrorResponses";
import { Types } from "mongoose";
import { serializeOne } from "@/lib/db";

export async function GET(req) {
    try {
        const user = await useUser({ token: cookies().get("token")?.value });
        if (!user) {
            return unauthorized;
        }

        const content = await Note.find(queryReadableResources(user));
        return NextResponse.json(
            {
                content,
            },
            { status: 200 },
        );
    } catch (error) {
        console.error(`[Note] GET error: ${error}`);
        return server;
    }
}

export async function POST(req) {
    try {
        const user = await useUser({ token: cookies().get("token")?.value });

        if (!user) {
            return unauthorized;
        }

        const { text, sources, tags, permissions } = await req.json();

        if (!text) {
            return NextResponse.json(
                {
                    message: "No text was added to this note",
                },
                { status: 400 },
            );
        }

        if (sources.length < 1) {
            return NextResponse.json(
                {
                    message: "At least one source is required to create a note",
                },
                { status: 400 },
            );
        }

        const noteRcvd = {
            createdBy: user._id,
            text: text,
            sources: [...sources],
            tags: [...tags],
            contributors: [user._id],
        };

        const note = new Note(noteRcvd);
        const content = await note.save();
        return NextResponse.json({ content }, { status: 201 });
    } catch (error) {
        console.error(`[Note] POST error: ${error}`);
        return server;
    }
}

export async function PUT(req) {
    try {
        const user = await useUser({ token: cookies().get("token")?.value });

        if (!user) {
            return unauthorized;
        }

        const { _id, text, sources, tags, permissions } = await req.json();

        const note = await Note.findById(_id);
        if (!note) {
            return NextResponse.json(
                {
                    message: `No note found with id ${_id}`,
                },
                { status: 404 },
            );
        }

        if (!canEdit(note, user)) {
            return NextResponse.json(
                {
                    message: `You are not permitted to edit note ${_id}`,
                },
                { status: 403 },
            );
        }

        if (text) {
            note.text = text;
        }
        if (sources) {
            sources.forEach((sourceId_req) => {
                if (
                    !note.sources.find(
                        (srcId) => srcId.toString() == sourceId_req,
                    )
                ) {
                    note.sources.push(new Types.ObjectId(sourceId_req));
                }
            });
        }

        if (tags) {
            note.tags = tags;
        }

        if (permissions && note.createdBy.toString() === user._id.toString()) {
            note.permissions = serializeOne(permissions);
        }

        if (!note.contributors.includes(user._id)) {
            note.contributors.push(user._id);
        }
        note.updateBy = user._id;

        const content = await note.save();
        return NextResponse.json({ content });
    } catch (error) {
        console.error(`[Note] PUT error: ${error}`);
        return server;
    }
}
