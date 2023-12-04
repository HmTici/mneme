import { NextResponse } from "next/server";
import { canEdit, queryReadableResources, useUser } from "@/lib/auth";
import { cookies } from "next/headers";
import Course from "../models/Course"; // Don't forget to add this to index.js
import { unauthorized, server } from "@/lib/apiErrorResponses";
import { buildPermissions } from "@/lib/permissions";
import { Types } from "mongoose";
import { serializeOne } from "@/lib/db";

export async function GET(req) {
    try {
        const user = await useUser({ token: cookies().get("token")?.value });
        if (!user) return unauthorized;

        const content = await Course.find(queryReadableResources(user));
        return NextResponse.json({
            content,
        });
    } catch (error) {
        console.error(`[Course] GET error: ${error}`);
        return server;
    }
}

export async function POST(req) {
    try {
        const user = await useUser({ token: cookies().get("token")?.value });
        if (!user) {
            return unauthorized;
        }

        const { name, description, parentCourses, prerequisites, permissions } =
            await req.json();

        if (!name || !description) {
            return NextResponse.json(
                { message: "Missing required information" },
                { status: 400 },
            );
        }

        const course = new Course({
            name,
            description,
            parentCourses,
            prerequisites,
            createdBy: user._id,
            contributors: [user._id],
        });

        course.permissions = buildPermissions(permissions);

        const content = await course.save();

        return NextResponse.json(
            {
                message: "Course created successfully",
                content,
            },
            { status: 201 },
        );
    } catch (error) {
        console.error(`[Course] POST error: ${error}`);
        return server;
    }
}

export async function PUT(req) {
    try {
        const user = await useUser({ token: cookies().get("token")?.value });

        if (!user) {
            return unauthorized;
        }

        const {
            _id,
            name,
            description,
            parentCourses,
            prerequisites,
            permissions,
        } = await req.json();

        const course = await Course.findById(_id);
        if (!course) {
            return NextResponse.json(
                {
                    message: `No course found with id ${_id}`,
                },
                { status: 404 },
            );
        }

        if (!canEdit(course, user)) {
            return NextResponse.json(
                {
                    message: `You are not permitted to edit course ${_id}`,
                },
                { status: 403 },
            );
        }

        if (name) {
            course.name = name;
        }
        if (description) {
            course.description = description;
        }
        if (parentCourses) {
            parentCourses.forEach((catId_req) => {
                if (
                    !course.parentCourses.find(
                        (catId) => catId.toString() == catId_req,
                    )
                ) {
                    course.parentCourses.push(new Types.ObjectId(catId_req));
                }
            });
        }
        if (prerequisites) {
            prerequisites.forEach((catId_req) => {
                if (
                    !course.prerequisites.find(
                        (catId) => catId.toString() == catId_req,
                    )
                ) {
                    course.prerequisites.push(new Types.ObjectId(catId_req));
                }
            });
        }

        if (
            permissions &&
            course.createdBy.toString() === user._id.toString()
        ) {
            course.permissions = serializeOne(permissions);
        }
        course.updatedBy = user._id;

        const content = await course.save();
        return NextResponse.json({ content });
    } catch (error) {
        console.error(`[Course] PUT error: ${error}`);
        return server;
    }
}
