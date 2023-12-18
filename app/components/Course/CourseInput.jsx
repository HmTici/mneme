"use client";

import { useStore, useModals, useAlerts } from "@/store/store";
import { useEffect, useState } from "react";
import { serializeOne } from "@/lib/db";
import MAX from "@/lib/max";
import {
    Input,
    InputPopup,
    Label,
    Spinner,
    UserInput,
    PermissionsInput,
    DeletePopup,
    ListAdd,
} from "@client";

export function CourseInput({ course }) {
    const [name, setName] = useState("");
    const [nameError, setNameError] = useState("");
    const [description, setDescription] = useState("");
    const [descriptionError, setDescriptionError] = useState("");
    const [permissions, setPermissions] = useState("");

    const [parentCourses, setParentCourses] = useState([]);
    const [prerequisites, setPrerequisites] = useState([]);

    const [loading, setLoading] = useState(false);

    const availableCourses = useStore((state) => state.courseStore);
    const user = useStore((state) => state.user);
    const canDelete = course && user && course.createdBy === user._id;
    const addModal = useModals((state) => state.addModal);
    const removeModal = useModals((state) => state.removeModal);
    const addAlert = useAlerts((state) => state.addAlert);

    useEffect(() => {
        if (!course) return;
        setName(course.name);
        setDescription(course.description);

        setParentCourses(
            course.parentCourses.map((catId) =>
                availableCourses.find((x) => x._id === catId),
            ),
        );

        setPrerequisites(
            course.prerequisites.map((catId) =>
                availableCourses.find((x) => x._id === catId),
            ),
        );

        if (course.permissions)
            setPermissions(serializeOne(course.permissions));
    }, []);

    async function handleSubmit(e) {
        e.preventDefault();

        if (name.length === 0) {
            setNameError(
                `Course name must be between 1 and ${MAX.name} characters`,
            );
        }
        if (description.length === 0) {
            setDescriptionError(
                `Course description must be between 1 and ${MAX.description} characters`,
            );
        }
        if (name.length === 0 || description.length === 0) {
            return;
        }

        const catPayload = {
            name,
            description,
            parentCourses: parentCourses.map((cat) => cat._id),
            prerequisites: prerequisites.map((cat) => ({
                requiredAverageLevel: 1,
                course: cat._id,
            })),
        };
        catPayload.permissions = permissions;
        if (course && course._id) {
            // this will change to implement PATCH in /[id]/route.js
            catPayload._id = course._id;
        }

        setLoading(true);

        const response = await fetch(
            `${process.env.NEXT_PUBLIC_BASEPATH ?? ""}/api/course`,
            {
                method: course && course._id ? "PUT" : "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify(catPayload),
            },
        );

        setLoading(false);

        if (response.status === 201) {
            setName("");
            setDescription("");

            addAlert({
                success: true,
                message: "Course added successfully",
            });
        } else if (response.status === 200) {
            addAlert({
                success: true,
                message: "Course edited successfully",
            });
        } else if (response.status === 401) {
            addAlert({
                success: false,
                message: "You have been signed out. Please sign in again.",
            });
            addModal({
                title: "Sign back in",
                content: <UserInput onSubmit={removeModal} />,
            });
        } else {
            addAlert({
                success: false,
                message: "Something went wrong",
            });
        }
    }

    return (
        <div className="formGrid">
            <Input
                required={true}
                onChange={(e) => {
                    setName(e.target.value);
                }}
                value={name}
                error={nameError}
                label={"Name"}
                maxLength={MAX.title}
            />

            <Input
                type="textarea"
                required={true}
                onChange={(e) => {
                    setDescription(e.target.value);
                }}
                value={description}
                error={descriptionError}
                label={"Description"}
                maxLength={MAX.description}
            />

            <div>
                <Label required={false} label="Parent Courses" />

                <ListAdd
                    item="Add parent course"
                    listChoices={availableCourses}
                    listChosen={parentCourses}
                    listProperty={"name"}
                    listSetter={setParentCourses}
                    createNew={<InputPopup type="course" />}
                    type="datalist"
                    messageIfNone="No parent course"
                />
            </div>

            <div>
                <Label
                    required={false}
                    label="Prerequisite courses (to be studied before this course)"
                />

                <ListAdd
                    item="Add prerequisite course"
                    listChoices={availableCourses}
                    listChosen={prerequisites}
                    listProperty={"name"}
                    listSetter={setPrerequisites}
                    createNew={<InputPopup type="course" />}
                    type="datalist"
                    messageIfNone="No prerequisites"
                />
            </div>

            {(!course || !user || course.createdBy === user._id) && (
                <PermissionsInput
                    permissions={course ? course.permissions : {}}
                    setter={setPermissions}
                />
            )}

            <button onClick={handleSubmit} className="button submit">
                {loading ? <Spinner /> : "Submit Course"}
            </button>

            {canDelete && (
                <DeletePopup resourceType="course" resourceId={course.id} />
            )}
        </div>
    );
}
