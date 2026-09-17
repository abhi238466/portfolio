import React, {
    useCallback,
    useEffect,
    useMemo,
    useState,
} from "react";

/*
|--------------------------------------------------------------------------
| API CONFIGURATION
|--------------------------------------------------------------------------
|
| Vite environment variable is preferred.
| Local development fallback:
|
| http://localhost:5000
|
*/

const API_BASE_URL =
    import.meta.env.VITE_API_BASE_URL ||
    "http://localhost:5000";

/*
|--------------------------------------------------------------------------
| EXPERIENCE TYPE OPTIONS
|--------------------------------------------------------------------------
*/

const EXPERIENCE_TYPES = [
    {
        value: "internship",
        label: "Internship",
    },
    {
        value: "full-time",
        label: "Full-Time",
    },
    {
        value: "part-time",
        label: "Part-Time",
    },
    {
        value: "freelance",
        label: "Freelance",
    },
    {
        value: "trainee",
        label: "Trainee",
    },
    {
        value: "contract",
        label: "Contract",
    },
    {
        value: "other",
        label: "Other",
    },
];

/*
|--------------------------------------------------------------------------
| WORK MODE OPTIONS
|--------------------------------------------------------------------------
*/

const WORK_MODES = [
    {
        value: "on-site",
        label: "On-site",
    },
    {
        value: "hybrid",
        label: "Hybrid",
    },
    {
        value: "remote",
        label: "Remote",
    },
    {
        value: "other",
        label: "Other",
    },
];

/*
|--------------------------------------------------------------------------
| EMPTY FORM
|--------------------------------------------------------------------------
*/

const createEmptyForm = () => ({
    companyName: "",
    companyWebsite: "",
    role: "",
    experienceType: "internship",

    startDate: "",
    endDate: "",
    currentlyWorking: false,

    duration: "",

    location: "",
    workMode: "on-site",

    description: "",

    responsibilities: [],
    technologies: [],
    skills: [],

    relatedProject: "",

    certificateUrl: "",

    isVisible: true,
    isFeatured: false,

    displayOrder: 0,

    isActive: true,
});

/*
|--------------------------------------------------------------------------
| NORMALIZE EXPERIENCE FOR FORM
|--------------------------------------------------------------------------
*/

const experienceToForm = (
    experience
) => {
    if (!experience) {
        return createEmptyForm();
    }

    const formatDate = (
        value
    ) => {
        if (!value) {
            return "";
        }

        const date =
            new Date(value);

        if (
            Number.isNaN(
                date.getTime()
            )
        ) {
            return "";
        }

        return date
            .toISOString()
            .slice(0, 10);
    };

    return {
        companyName:
            experience.companyName ||
            "",

        companyWebsite:
            experience.companyWebsite ||
            "",

        role:
            experience.role ||
            "",

        experienceType:
            experience.experienceType ||
            "internship",

        startDate:
            formatDate(
                experience.startDate
            ),

        endDate:
            formatDate(
                experience.endDate
            ),

        currentlyWorking:
            experience.currentlyWorking ===
            true,

        duration:
            experience.duration ||
            "",

        location:
            experience.location ||
            "",

        workMode:
            experience.workMode ||
            "on-site",

        description:
            experience.description ||
            "",

        responsibilities:
            Array.isArray(
                experience.responsibilities
            )
                ? [
                    ...experience.responsibilities,
                ]
                : [],

        technologies:
            Array.isArray(
                experience.technologies
            )
                ? [
                    ...experience.technologies,
                ]
                : [],

        skills:
            Array.isArray(
                experience.skills
            )
                ? [
                    ...experience.skills,
                ]
                : [],

        relatedProject:
            experience.relatedProject
                ? String(
                    typeof experience.relatedProject ===
                        "object"
                        ? experience.relatedProject._id ||
                        experience.relatedProject.id ||
                        ""
                        : experience.relatedProject
                )
                : "",

        certificateUrl:
            experience.certificateUrl ||
            "",

        isVisible:
            experience.isVisible !==
            false,

        isFeatured:
            experience.isFeatured ===
            true,

        displayOrder:
            Number(
                experience.displayOrder ||
                0
            ),

        isActive:
            experience.isActive !==
            false,
    };
};

/*
|--------------------------------------------------------------------------
| MAIN COMPONENT
|--------------------------------------------------------------------------
*/

const AdminExperience =
    () => {
        /*
        |--------------------------------------------------------------------------
        | EXPERIENCE DATA
        |--------------------------------------------------------------------------
        */

        const [
            experiences,
            setExperiences,
        ] = useState([]);

        /*
        |--------------------------------------------------------------------------
        | FORM
        |--------------------------------------------------------------------------
        */

        const [
            form,
            setForm,
        ] = useState(
            createEmptyForm()
        );

        /*
        |--------------------------------------------------------------------------
        | EDITING
        |--------------------------------------------------------------------------
        */

        const [
            editingExperienceId,
            setEditingExperienceId,
        ] = useState(null);

        /*
        |--------------------------------------------------------------------------
        | LOADING STATES
        |--------------------------------------------------------------------------
        */

        const [
            loading,
            setLoading,
        ] = useState(true);

        const [
            saving,
            setSaving,
        ] = useState(false);

        const [
            deletingId,
            setDeletingId,
        ] = useState(null);

        const [
            uploadingDocument,
            setUploadingDocument,
        ] = useState(false);

        const [
            deletingDocumentId,
            setDeletingDocumentId,
        ] = useState(null);

        const [
            actionLoading,
            setActionLoading,
        ] = useState("");

        /*
        |--------------------------------------------------------------------------
        | DOCUMENT INPUT
        |--------------------------------------------------------------------------
        */

        const [
            selectedDocument,
            setSelectedDocument,
        ] = useState(null);

        /*
        |--------------------------------------------------------------------------
        | DOCUMENT REPLACE
        |--------------------------------------------------------------------------
        */

        const [
            replacingDocument,
            setReplacingDocument,
        ] = useState(null);

        /*
        |--------------------------------------------------------------------------
        | TOAST
        |--------------------------------------------------------------------------
        |
        | Local toast only.
        | No global toast system is used.
        |
        */

        const [
            toast,
            setToast,
        ] = useState(null);

        /*
        |--------------------------------------------------------------------------
        | CONFIRMATION MODAL
        |--------------------------------------------------------------------------
        */

        const [
            confirmation,
            setConfirmation,
        ] = useState(null);

        /*
        |--------------------------------------------------------------------------
        | PROJECT ID / RELATED PROJECT
        |--------------------------------------------------------------------------
        |
        | Backend supports relatedProject as an ObjectId.
        |
        | We keep the ID field flexible here because the Project module
        | already exists independently.
        |
        */

        /*
        |--------------------------------------------------------------------------
        | SEARCH
        |--------------------------------------------------------------------------
        */

        const [
            searchTerm,
            setSearchTerm,
        ] = useState("");

        /*
        |--------------------------------------------------------------------------
        | FILTER
        |--------------------------------------------------------------------------
        */

        const [
            filter,
            setFilter,
        ] = useState("all");

        /*
        |--------------------------------------------------------------------------
        | SHOW FORM
        |--------------------------------------------------------------------------
        */

        const [
            showForm,
            setShowForm,
        ] = useState(false);

        /*
        |--------------------------------------------------------------------------
        | TOAST HELPER
        |--------------------------------------------------------------------------
        */

        const showToast =
            useCallback(
                (
                    type,
                    message
                ) => {
                    setToast({
                        id:
                            Date.now(),
                        type,
                        message,
                    });

                    window.setTimeout(
                        () => {
                            setToast(null);
                        },
                        4000
                    );
                },
                []
            );

        /*
        |--------------------------------------------------------------------------
        | API ERROR MESSAGE
        |--------------------------------------------------------------------------
        */

        const getErrorMessage =
            async (
                response,
                fallback
            ) => {
                try {
                    const data =
                        await response.json();

                    if (
                        data?.message
                    ) {
                        return data.message;
                    }
                } catch {
                    /*
                     * Ignore JSON parsing failure.
                     */
                }

                return fallback;
            };

        /*
        |--------------------------------------------------------------------------
        | HANDLE AUTH FAILURE
        |--------------------------------------------------------------------------
        */

        const handleUnauthorized =
            useCallback(
                (
                    response
                ) => {
                    if (
                        response.status ===
                        401
                    ) {
                        showToast(
                            "error",
                            "🔒 Your admin session has expired. Please log in again."
                        );

                        window.setTimeout(
                            () => {
                                window.location.href =
                                    "/admin/login";
                            },
                            900
                        );

                        return true;
                    }

                    return false;
                },
                [showToast]
            );

        /*
        |--------------------------------------------------------------------------
        | FETCH EXPERIENCES
        |--------------------------------------------------------------------------
        */

        const fetchExperiences =
            useCallback(
                async () => {
                    setLoading(true);

                    try {
                        const response =
                            await fetch(
                                `${API_BASE_URL}/api/admin/experience`,
                                {
                                    method:
                                        "GET",

                                    credentials:
                                        "include",

                                    headers: {
                                        Accept:
                                            "application/json",
                                    },
                                }
                            );

                        if (
                            handleUnauthorized(
                                response
                            )
                        ) {
                            return;
                        }

                        if (
                            !response.ok
                        ) {
                            throw new Error(
                                await getErrorMessage(
                                    response,
                                    "Unable to load experiences."
                                )
                            );
                        }

                        const data =
                            await response.json();

                        setExperiences(
                            Array.isArray(
                                data?.experiences
                            )
                                ? data.experiences
                                : []
                        );
                    } catch (error) {
                        console.error(
                            "Experience fetch error:",
                            error
                        );

                        showToast(
                            "error",
                            `⚠️ ${error.message ||
                            "Unable to load experiences."
                            }`
                        );
                    } finally {
                        setLoading(false);
                    }
                },
                [
                    handleUnauthorized,
                    showToast,
                ]
            );

        /*
        |--------------------------------------------------------------------------
        | INITIAL LOAD
        |--------------------------------------------------------------------------
        */

        useEffect(
            () => {
                fetchExperiences();
            },
            [
                fetchExperiences,
            ]
        );

        /*
        |--------------------------------------------------------------------------
        | HANDLE FORM CHANGE
        |--------------------------------------------------------------------------
        */

        const handleChange =
            (
                event
            ) => {
                const {
                    name,
                    value,
                    type,
                    checked,
                } = event.target;

                setForm(
                    (
                        previous
                    ) => ({
                        ...previous,

                        [name]:
                            type ===
                                "checkbox"
                                ? checked
                                : value,
                    })
                );
            };

        /*
        |--------------------------------------------------------------------------
        | HANDLE ARRAY INPUT
        |--------------------------------------------------------------------------
        */

        const handleArrayChange =
            (
                field,
                value
            ) => {
                const items =
                    value
                        .split(
                            field === "responsibilities"
                                ? /\r?\n/
                                : ","
                        )
                        .map(
                            (
                                item
                            ) =>
                                item.trim()
                        )
                        .filter(
                            Boolean
                        );

                setForm(
                    (
                        previous
                    ) => ({
                        ...previous,
                        [field]:
                            items,
                    })
                );
            };
        /*
        |--------------------------------------------------------------------------
        | OPEN CREATE FORM
        |--------------------------------------------------------------------------
        */

        const openCreateForm =
            () => {
                setEditingExperienceId(
                    null
                );

                setForm(
                    createEmptyForm()
                );

                setSelectedDocument(
                    null
                );

                setReplacingDocument(
                    null
                );

                setShowForm(
                    true
                );

                window.scrollTo({
                    top: 0,
                    behavior:
                        "smooth",
                });
            };

        /*
        |--------------------------------------------------------------------------
        | OPEN EDIT FORM
        |--------------------------------------------------------------------------
        */

        const openEditForm =
            (
                experience
            ) => {
                setEditingExperienceId(
                    String(
                        experience._id ||
                        experience.id
                    )
                );

                setForm(
                    experienceToForm(
                        experience
                    )
                );

                setSelectedDocument(
                    null
                );

                setReplacingDocument(
                    null
                );

                setShowForm(
                    true
                );

                window.scrollTo({
                    top: 0,
                    behavior:
                        "smooth",
                });
            };

        /*
        |--------------------------------------------------------------------------
        | CLOSE FORM
        |--------------------------------------------------------------------------
        */

        const closeForm =
            () => {
                if (
                    saving
                ) {
                    return;
                }

                setShowForm(
                    false
                );

                setEditingExperienceId(
                    null
                );

                setForm(
                    createEmptyForm()
                );

                setSelectedDocument(
                    null
                );

                setReplacingDocument(
                    null
                );
            };

        /*
        |--------------------------------------------------------------------------
        | SAVE EXPERIENCE
        |--------------------------------------------------------------------------
        */

        const saveExperience =
            async (
                event
            ) => {
                event.preventDefault();

                if (
                    !form.companyName.trim()
                ) {
                    showToast(
                        "error",
                        "🏢 Company Name is required."
                    );

                    return;
                }

                if (
                    !form.role.trim()
                ) {
                    showToast(
                        "error",
                        "💼 Role / Designation is required."
                    );

                    return;
                }

                if (
                    !form.startDate
                ) {
                    showToast(
                        "error",
                        "📅 Start Date is required."
                    );

                    return;
                }

                if (
                    !form.currentlyWorking &&
                    form.endDate &&
                    form.endDate <
                    form.startDate
                ) {
                    showToast(
                        "error",
                        "📅 End Date cannot be earlier than Start Date."
                    );

                    return;
                }

                setSaving(
                    true
                );

                try {
                    const isEditing =
                        Boolean(
                            editingExperienceId
                        );

                    const url =
                        isEditing
                            ? `${API_BASE_URL}/api/admin/experience/${editingExperienceId}`
                            : `${API_BASE_URL}/api/admin/experience`;

                    const method =
                        isEditing
                            ? "PUT"
                            : "POST";

                    const payload =
                    {
                        companyName:
                            form.companyName.trim(),

                        companyWebsite:
                            form.companyWebsite.trim(),

                        role:
                            form.role.trim(),

                        experienceType:
                            form.experienceType,

                        startDate:
                            form.startDate,

                        endDate:
                            form.currentlyWorking
                                ? null
                                : form.endDate ||
                                null,

                        currentlyWorking:
                            Boolean(
                                form.currentlyWorking
                            ),

                        duration:
                            form.duration.trim(),

                        location:
                            form.location.trim(),

                        workMode:
                            form.workMode,

                        description:
                            form.description.trim(),

                        responsibilities:
                            form.responsibilities,

                        technologies:
                            form.technologies,

                        skills:
                            form.skills,

                        relatedProject:
                            form.relatedProject.trim() ||
                            null,

                        certificateUrl:
                            form.certificateUrl.trim(),

                        isVisible:
                            Boolean(
                                form.isVisible
                            ),

                        isFeatured:
                            Boolean(
                                form.isFeatured
                            ),

                        displayOrder:
                            Number(
                                form.displayOrder ||
                                0
                            ),

                        isActive:
                            Boolean(
                                form.isActive
                            ),
                    };

                    const response =
                        await fetch(
                            url,
                            {
                                method,

                                credentials:
                                    "include",

                                headers: {
                                    "Content-Type":
                                        "application/json",

                                    Accept:
                                        "application/json",
                                },

                                body:
                                    JSON.stringify(
                                        payload
                                    ),
                            }
                        );

                    if (
                        handleUnauthorized(
                            response
                        )
                    ) {
                        return;
                    }

                    if (
                        !response.ok
                    ) {
                        throw new Error(
                            await getErrorMessage(
                                response,
                                isEditing
                                    ? "Unable to update experience."
                                    : "Unable to create experience."
                            )
                        );
                    }

                    const data =
                        await response.json();

                    if (
                        isEditing
                    ) {
                        setExperiences(
                            (
                                previous
                            ) =>
                                previous.map(
                                    (
                                        item
                                    ) =>
                                        String(
                                            item._id ||
                                            item.id
                                        ) ===
                                            String(
                                                editingExperienceId
                                            )
                                            ? data.experience
                                            : item
                                )
                        );

                        showToast(
                            "success",
                            "✨ Experience updated successfully."
                        );
                    } else {
                        setExperiences(
                            (
                                previous
                            ) => [
                                    ...previous,
                                    data.experience,
                                ]
                        );

                        showToast(
                            "success",
                            "🎉 Experience created successfully."
                        );
                    }

                    /*
                    |--------------------------------------------------------------------------
                    | RESET FORM
                    |--------------------------------------------------------------------------
                    */

                    setShowForm(
                        false
                    );

                    setEditingExperienceId(
                        null
                    );

                    setForm(
                        createEmptyForm()
                    );

                    setSelectedDocument(
                        null
                    );
                } catch (error) {
                    console.error(
                        "Experience save error:",
                        error
                    );

                    showToast(
                        "error",
                        `⚠️ ${error.message ||
                        "Unable to save experience."
                        }`
                    );
                } finally {
                    setSaving(false);
                }
            };

        /*
        |--------------------------------------------------------------------------
        | DELETE EXPERIENCE REQUEST
        |--------------------------------------------------------------------------
        */

        const requestDeleteExperience =
            (
                experience
            ) => {
                const id =
                    String(
                        experience._id ||
                        experience.id
                    );

                setConfirmation({
                    title:
                        "Delete Experience?",
                    message:
                        `Are you sure you want to delete "${experience.role}" at "${experience.companyName}"? This will also remove its stored Experience documents from Cloudinary.`,
                    confirmText:
                        "Delete",
                    cancelText:
                        "Cancel",
                    danger: true,
                    onConfirm:
                        () =>
                            deleteExperience(
                                id
                            ),
                });
            };

        /*
        |--------------------------------------------------------------------------
        | DELETE EXPERIENCE
        |--------------------------------------------------------------------------
        */

        const deleteExperience =
            async (
                experienceId
            ) => {
                setConfirmation(
                    null
                );

                setDeletingId(
                    experienceId
                );

                try {
                    const response =
                        await fetch(
                            `${API_BASE_URL}/api/admin/experience/${experienceId}`,
                            {
                                method:
                                    "DELETE",

                                credentials:
                                    "include",

                                headers: {
                                    Accept:
                                        "application/json",
                                },
                            }
                        );

                    if (
                        handleUnauthorized(
                            response
                        )
                    ) {
                        return;
                    }

                    if (
                        !response.ok
                    ) {
                        throw new Error(
                            await getErrorMessage(
                                response,
                                "Unable to delete experience."
                            )
                        );
                    }

                    setExperiences(
                        (
                            previous
                        ) =>
                            previous.filter(
                                (
                                    item
                                ) =>
                                    String(
                                        item._id ||
                                        item.id
                                    ) !==
                                    String(
                                        experienceId
                                    )
                            )
                    );

                    if (
                        String(
                            editingExperienceId
                        ) ===
                        String(
                            experienceId
                        )
                    ) {
                        closeForm();
                    }

                    showToast(
                        "success",
                        "🗑️ Experience deleted successfully."
                    );
                } catch (error) {
                    console.error(
                        "Experience delete error:",
                        error
                    );

                    showToast(
                        "error",
                        `⚠️ ${error.message ||
                        "Unable to delete experience."
                        }`
                    );
                } finally {
                    setDeletingId(
                        null
                    );
                }
            };

        /*
        |--------------------------------------------------------------------------
        | UPDATE EXPERIENCE PROPERTY
        |--------------------------------------------------------------------------
        */

        const updateExperienceProperty =
            async (
                experienceId,
                endpoint,
                body,
                successMessage
            ) => {
                const loadingKey =
                    `${experienceId}-${endpoint}`;

                setActionLoading(
                    loadingKey
                );

                try {
                    const response =
                        await fetch(
                            `${API_BASE_URL}/api/admin/experience/${experienceId}/${endpoint}`,
                            {
                                method:
                                    "PATCH",

                                credentials:
                                    "include",

                                headers: {
                                    "Content-Type":
                                        "application/json",

                                    Accept:
                                        "application/json",
                                },

                                body:
                                    JSON.stringify(
                                        body
                                    ),
                            }
                        );

                    if (
                        handleUnauthorized(
                            response
                        )
                    ) {
                        return;
                    }

                    if (
                        !response.ok
                    ) {
                        throw new Error(
                            await getErrorMessage(
                                response,
                                "Unable to update experience."
                            )
                        );
                    }

                    const data =
                        await response.json();

                    setExperiences(
                        (
                            previous
                        ) =>
                            previous.map(
                                (
                                    item
                                ) =>
                                    String(
                                        item._id ||
                                        item.id
                                    ) ===
                                        String(
                                            experienceId
                                        )
                                        ? data.experience
                                        : item
                            )
                    );

                    showToast(
                        "success",
                        successMessage
                    );
                } catch (error) {
                    console.error(
                        "Experience property update error:",
                        error
                    );

                    showToast(
                        "error",
                        `⚠️ ${error.message ||
                        "Unable to update experience."
                        }`
                    );
                } finally {
                    setActionLoading(
                        ""
                    );
                }
            };

        /*
        |--------------------------------------------------------------------------
        | TOGGLE VISIBILITY
        |--------------------------------------------------------------------------
        */

        const toggleVisibility =
            (
                experience
            ) => {
                const id =
                    String(
                        experience._id ||
                        experience.id
                    );

                updateExperienceProperty(
                    id,
                    "visibility",
                    {
                        isVisible:
                            !experience.isVisible,
                    },
                    !experience.isVisible
                        ? "👁️ Experience is now publicly visible."
                        : "🙈 Experience hidden from public portfolio."
                );
            };

        /*
        |--------------------------------------------------------------------------
        | TOGGLE FEATURED
        |--------------------------------------------------------------------------
        */

        const toggleFeatured =
            (
                experience
            ) => {
                const id =
                    String(
                        experience._id ||
                        experience.id
                    );

                updateExperienceProperty(
                    id,
                    "featured",
                    {
                        isFeatured:
                            !experience.isFeatured,
                    },
                    !experience.isFeatured
                        ? "⭐ Experience marked as featured."
                        : "✨ Experience removed from featured."
                );
            };

        /*
        |--------------------------------------------------------------------------
        | TOGGLE ACTIVE
        |--------------------------------------------------------------------------
        */

        const toggleActive =
            (
                experience
            ) => {
                const id =
                    String(
                        experience._id ||
                        experience.id
                    );

                updateExperienceProperty(
                    id,
                    "active",
                    {
                        isActive:
                            !experience.isActive,
                    },
                    !experience.isActive
                        ? "🟢 Experience activated successfully."
                        : "⚪ Experience deactivated successfully."
                );
            };

        /*
        |--------------------------------------------------------------------------
        | UPDATE DISPLAY ORDER
        |--------------------------------------------------------------------------
        */

        const updateDisplayOrder =
            (
                experience,
                value
            ) => {
                const id =
                    String(
                        experience._id ||
                        experience.id
                    );

                const number =
                    Number(
                        value
                    );

                if (
                    !Number.isFinite(
                        number
                    ) ||
                    number < 0
                ) {
                    showToast(
                        "error",
                        "↕️ Display order must be a valid number."
                    );

                    return;
                }

                updateExperienceProperty(
                    id,
                    "display-order",
                    {
                        displayOrder:
                            number,
                    },
                    "↕️ Display order updated successfully."
                );
            };

        /*
        |--------------------------------------------------------------------------
        | DOCUMENT SELECT
        |--------------------------------------------------------------------------
        */

        const handleDocumentSelect =
            (
                event
            ) => {
                const file =
                    event.target
                        .files?.[0];

                if (!file) {
                    setSelectedDocument(
                        null
                    );

                    return;
                }

                const allowedTypes =
                    [
                        "image/jpeg",
                        "image/png",
                        "image/webp",
                        "application/pdf",
                    ];

                if (
                    !allowedTypes.includes(
                        file.type
                    )
                ) {
                    showToast(
                        "error",
                        "📄 Only JPG, JPEG, PNG, WEBP, and PDF files are allowed."
                    );

                    event.target.value =
                        "";

                    setSelectedDocument(
                        null
                    );

                    return;
                }

                const maxSize =
                    10 *
                    1024 *
                    1024;

                if (
                    file.size >
                    maxSize
                ) {
                    showToast(
                        "error",
                        "📦 Experience document must be 10 MB or smaller."
                    );

                    event.target.value =
                        "";

                    setSelectedDocument(
                        null
                    );

                    return;
                }

                setSelectedDocument(
                    file
                );
            };

        /*
        |--------------------------------------------------------------------------
        | UPLOAD EXPERIENCE DOCUMENT
        |--------------------------------------------------------------------------
        */

        const uploadDocument =
            async (
                experienceId,
                file
            ) => {
                if (!file) {
                    showToast(
                        "error",
                        "📄 Please select a document first."
                    );

                    return null;
                }

                setUploadingDocument(
                    true
                );

                try {
                    const formData =
                        new FormData();

                    formData.append(
                        "document",
                        file
                    );

                    const response =
                        await fetch(
                            `${API_BASE_URL}/api/admin/experience/${experienceId}/documents`,
                            {
                                method:
                                    "POST",

                                credentials:
                                    "include",

                                body:
                                    formData,
                            }
                        );

                    if (
                        handleUnauthorized(
                            response
                        )
                    ) {
                        return null;
                    }

                    if (
                        !response.ok
                    ) {
                        throw new Error(
                            await getErrorMessage(
                                response,
                                "Unable to upload experience document."
                            )
                        );
                    }

                    const data =
                        await response.json();

                    setExperiences(
                        (
                            previous
                        ) =>
                            previous.map(
                                (
                                    item
                                ) =>
                                    String(
                                        item._id ||
                                        item.id
                                    ) ===
                                        String(
                                            experienceId
                                        )
                                        ? data.experience
                                        : item
                            )
                    );

                    setSelectedDocument(
                        null
                    );

                    showToast(
                        "success",
                        "📄✨ Experience document uploaded successfully."
                    );

                    return data.experience;
                } catch (error) {
                    console.error(
                        "Experience document upload error:",
                        error
                    );

                    showToast(
                        "error",
                        `⚠️ ${error.message ||
                        "Unable to upload experience document."
                        }`
                    );

                    return null;
                } finally {
                    setUploadingDocument(
                        false
                    );
                }
            };

        /*
        |--------------------------------------------------------------------------
        | DELETE EXPERIENCE DOCUMENT
        |--------------------------------------------------------------------------
        */

        const requestDeleteDocument =
            (
                experience,
                document
            ) => {
                setConfirmation({
                    title:
                        "Delete Document?",
                    message:
                        `Are you sure you want to delete "${document.originalName}"? This will permanently remove the document from the Experience record and Cloudinary.`,
                    confirmText:
                        "Delete",
                    cancelText:
                        "Cancel",
                    danger: true,
                    onConfirm:
                        () =>
                            deleteDocument(
                                experience,
                                document
                            ),
                });
            };

        /*
        |--------------------------------------------------------------------------
        | DELETE DOCUMENT
        |--------------------------------------------------------------------------
        */

        const deleteDocument =
            async (
                experience,
                document
            ) => {
                setConfirmation(
                    null
                );

                const experienceId =
                    String(
                        experience._id ||
                        experience.id
                    );

                const documentId =
                    String(
                        document._id ||
                        document.id
                    );

                setDeletingDocumentId(
                    documentId
                );

                try {
                    const response =
                        await fetch(
                            `${API_BASE_URL}/api/admin/experience/${experienceId}/documents/${documentId}`,
                            {
                                method:
                                    "DELETE",

                                credentials:
                                    "include",

                                headers: {
                                    Accept:
                                        "application/json",
                                },
                            }
                        );

                    if (
                        handleUnauthorized(
                            response
                        )
                    ) {
                        return;
                    }

                    if (
                        !response.ok
                    ) {
                        throw new Error(
                            await getErrorMessage(
                                response,
                                "Unable to delete experience document."
                            )
                        );
                    }

                    const data =
                        await response.json();

                    setExperiences(
                        (
                            previous
                        ) =>
                            previous.map(
                                (
                                    item
                                ) =>
                                    String(
                                        item._id ||
                                        item.id
                                    ) ===
                                        experienceId
                                        ? data.experience
                                        : item
                            )
                    );

                    showToast(
                        "success",
                        "🗑️ Experience document deleted successfully."
                    );
                } catch (error) {
                    console.error(
                        "Experience document delete error:",
                        error
                    );

                    showToast(
                        "error",
                        `⚠️ ${error.message ||
                        "Unable to delete experience document."
                        }`
                    );
                } finally {
                    setDeletingDocumentId(
                        null
                    );
                }
            };

        /*
        |--------------------------------------------------------------------------
        | REPLACE DOCUMENT
        |--------------------------------------------------------------------------
        |
        | Backend intentionally keeps add/delete as separate secure operations.
        |
        | For replacement:
        |
        | 1. Upload the new document.
        | 2. Delete the old document.
        |
        | This preserves the old document until the new upload succeeds.
        |
        */

        const requestReplaceDocument =
            (
                experience,
                document,
                file
            ) => {
                if (!file) {
                    showToast(
                        "error",
                        "📄 Please select a replacement document."
                    );

                    return;
                }

                setConfirmation({
                    title:
                        "Replace Document?",
                    message:
                        `Replace "${document.originalName}" with "${file.name}"? The old document will be deleted after the new document uploads successfully.`,
                    confirmText:
                        "Replace",
                    cancelText:
                        "Cancel",
                    danger: false,
                    onConfirm:
                        () =>
                            replaceDocument(
                                experience,
                                document,
                                file
                            ),
                });
            };

        /*
        |--------------------------------------------------------------------------
        | REPLACE DOCUMENT
        |--------------------------------------------------------------------------
        */

        const replaceDocument =
            async (
                experience,
                oldDocument,
                newFile
            ) => {
                setConfirmation(
                    null
                );

                const experienceId =
                    String(
                        experience._id ||
                        experience.id
                    );

                setReplacingDocument(
                    String(
                        oldDocument._id ||
                        oldDocument.id
                    )
                );

                try {
                    /*
                    |--------------------------------------------------------------------------
                    | UPLOAD NEW DOCUMENT FIRST
                    |--------------------------------------------------------------------------
                    */

                    const formData =
                        new FormData();

                    formData.append(
                        "document",
                        newFile
                    );

                    const uploadResponse =
                        await fetch(
                            `${API_BASE_URL}/api/admin/experience/${experienceId}/documents`,
                            {
                                method:
                                    "POST",

                                credentials:
                                    "include",

                                body:
                                    formData,
                            }
                        );

                    if (
                        handleUnauthorized(
                            uploadResponse
                        )
                    ) {
                        return;
                    }

                    if (
                        !uploadResponse.ok
                    ) {
                        throw new Error(
                            await getErrorMessage(
                                uploadResponse,
                                "Unable to upload replacement document."
                            )
                        );
                    }

                    const uploadData =
                        await uploadResponse.json();

                    /*
                    |--------------------------------------------------------------------------
                    | NEW DOCUMENT UPLOADED
                    |--------------------------------------------------------------------------
                    */

                    const updatedExperience =
                        uploadData.experience;

                    setExperiences(
                        (
                            previous
                        ) =>
                            previous.map(
                                (
                                    item
                                ) =>
                                    String(
                                        item._id ||
                                        item.id
                                    ) ===
                                        experienceId
                                        ? updatedExperience
                                        : item
                            )
                    );

                    /*
                    |--------------------------------------------------------------------------
                    | DELETE OLD DOCUMENT
                    |--------------------------------------------------------------------------
                    */

                    const oldDocumentId =
                        String(
                            oldDocument._id ||
                            oldDocument.id
                        );

                    const deleteResponse =
                        await fetch(
                            `${API_BASE_URL}/api/admin/experience/${experienceId}/documents/${oldDocumentId}`,
                            {
                                method:
                                    "DELETE",

                                credentials:
                                    "include",

                                headers: {
                                    Accept:
                                        "application/json",
                                },
                            }
                        );

                    if (
                        handleUnauthorized(
                            deleteResponse
                        )
                    ) {
                        return;
                    }

                    if (
                        !deleteResponse.ok
                    ) {
                        throw new Error(
                            await getErrorMessage(
                                deleteResponse,
                                "New document uploaded, but old document could not be removed."
                            )
                        );
                    }

                    const deleteData =
                        await deleteResponse.json();

                    setExperiences(
                        (
                            previous
                        ) =>
                            previous.map(
                                (
                                    item
                                ) =>
                                    String(
                                        item._id ||
                                        item.id
                                    ) ===
                                        experienceId
                                        ? deleteData.experience
                                        : item
                            )
                    );

                    showToast(
                        "success",
                        "🔄✨ Experience document replaced successfully."
                    );
                } catch (error) {
                    console.error(
                        "Experience document replacement error:",
                        error
                    );

                    showToast(
                        "error",
                        `⚠️ ${error.message ||
                        "Unable to replace experience document."
                        }`
                    );
                } finally {
                    setReplacingDocument(
                        null
                    );
                }
            };

        /*
        |--------------------------------------------------------------------------
        | GET SECURE DOCUMENT URL
        |--------------------------------------------------------------------------
        */

        const openSecureDocument =
            async (
                experience,
                document
            ) => {
                const experienceId =
                    String(
                        experience._id ||
                        experience.id
                    );

                const documentId =
                    String(
                        document._id ||
                        document.id
                    );

                const loadingKey =
                    `document-${documentId}`;

                setActionLoading(
                    loadingKey
                );

                try {
                    const response =
                        await fetch(
                            `${API_BASE_URL}/api/admin/experience/${experienceId}/documents/${documentId}/url`,
                            {
                                method:
                                    "GET",

                                credentials:
                                    "include",

                                headers: {
                                    Accept:
                                        "application/json",
                                },
                            }
                        );

                    if (
                        handleUnauthorized(
                            response
                        )
                    ) {
                        return;
                    }

                    if (
                        !response.ok
                    ) {
                        throw new Error(
                            await getErrorMessage(
                                response,
                                "Unable to generate secure document URL."
                            )
                        );
                    }

                    const data =
                        await response.json();

                    if (
                        !data?.url
                    ) {
                        throw new Error(
                            "Secure document URL was not returned."
                        );
                    }

                    window.open(
                        data.url,
                        "_blank",
                        "noopener,noreferrer"
                    );
                } catch (error) {
                    console.error(
                        "Secure document URL error:",
                        error
                    );

                    showToast(
                        "error",
                        `⚠️ ${error.message ||
                        "Unable to open document."
                        }`
                    );
                } finally {
                    setActionLoading(
                        ""
                    );
                }
            };

        /*
        |--------------------------------------------------------------------------
        | REORDER DOCUMENTS
        |--------------------------------------------------------------------------
        */

        const moveDocument =
            async (
                experience,
                documentIndex,
                direction
            ) => {
                const documents =
                    Array.isArray(
                        experience.documents
                    )
                        ? [
                            ...experience.documents,
                        ]
                        : [];

                const targetIndex =
                    documentIndex +
                    direction;

                if (
                    targetIndex <
                    0 ||
                    targetIndex >=
                    documents.length
                ) {
                    return;
                }

                const reordered =
                    [
                        ...documents,
                    ];

                const current =
                    reordered[
                    documentIndex
                    ];

                reordered[
                    documentIndex
                ] =
                    reordered[
                    targetIndex
                    ];

                reordered[
                    targetIndex
                ] =
                    current;

                const orderedDocumentIds =
                    reordered.map(
                        (
                            document
                        ) =>
                            String(
                                document._id ||
                                document.id
                            )
                    );

                const experienceId =
                    String(
                        experience._id ||
                        experience.id
                    );

                setActionLoading(
                    `reorder-${experienceId}`
                );

                try {
                    const response =
                        await fetch(
                            `${API_BASE_URL}/api/admin/experience/${experienceId}/documents/reorder`,
                            {
                                method:
                                    "PATCH",

                                credentials:
                                    "include",

                                headers: {
                                    "Content-Type":
                                        "application/json",

                                    Accept:
                                        "application/json",
                                },

                                body:
                                    JSON.stringify({
                                        orderedDocumentIds,
                                    }),
                            }
                        );

                    if (
                        handleUnauthorized(
                            response
                        )
                    ) {
                        return;
                    }

                    if (
                        !response.ok
                    ) {
                        throw new Error(
                            await getErrorMessage(
                                response,
                                "Unable to reorder documents."
                            )
                        );
                    }

                    const data =
                        await response.json();

                    setExperiences(
                        (
                            previous
                        ) =>
                            previous.map(
                                (
                                    item
                                ) =>
                                    String(
                                        item._id ||
                                        item.id
                                    ) ===
                                        experienceId
                                        ? data.experience
                                        : item
                            )
                    );

                    showToast(
                        "success",
                        "↕️ Document order updated successfully."
                    );
                } catch (error) {
                    console.error(
                        "Document reorder error:",
                        error
                    );

                    showToast(
                        "error",
                        `⚠️ ${error.message ||
                        "Unable to reorder documents."
                        }`
                    );
                } finally {
                    setActionLoading(
                        ""
                    );
                }
            };

        /*
        |--------------------------------------------------------------------------
        | FILTERED EXPERIENCES
        |--------------------------------------------------------------------------
        */

        const filteredExperiences =
            useMemo(
                () => {
                    const search =
                        searchTerm
                            .trim()
                            .toLowerCase();

                    return [
                        ...experiences,
                    ]
                        .filter(
                            (
                                experience
                            ) => {
                                if (
                                    filter ===
                                    "visible"
                                ) {
                                    return (
                                        experience.isVisible ===
                                        true
                                    );
                                }

                                if (
                                    filter ===
                                    "hidden"
                                ) {
                                    return (
                                        experience.isVisible !==
                                        true
                                    );
                                }

                                if (
                                    filter ===
                                    "featured"
                                ) {
                                    return (
                                        experience.isFeatured ===
                                        true
                                    );
                                }

                                if (
                                    filter ===
                                    "inactive"
                                ) {
                                    return (
                                        experience.isActive !==
                                        true
                                    );
                                }

                                return true;
                            }
                        )
                        .filter(
                            (
                                experience
                            ) => {
                                if (
                                    !search
                                ) {
                                    return true;
                                }

                                const searchableText =
                                    [
                                        experience.companyName,
                                        experience.role,
                                        experience.experienceType,
                                        experience.location,
                                        experience.description,
                                        ...(Array.isArray(
                                            experience.technologies
                                        )
                                            ? experience.technologies
                                            : []),
                                        ...(Array.isArray(
                                            experience.skills
                                        )
                                            ? experience.skills
                                            : []),
                                    ]
                                        .join(" ")
                                        .toLowerCase();

                                return searchableText.includes(
                                    search
                                );
                            }
                        )
                        .sort(
                            (
                                first,
                                second
                            ) =>
                                Number(
                                    first.displayOrder ||
                                    0
                                ) -
                                Number(
                                    second.displayOrder ||
                                    0
                                ) ||
                                new Date(
                                    second.startDate ||
                                    0
                                ) -
                                new Date(
                                    first.startDate ||
                                    0
                                )
                        );
                },
                [
                    experiences,
                    filter,
                    searchTerm,
                ]
            );

        /*
        |--------------------------------------------------------------------------
        | FORM ARRAY DISPLAY
        |--------------------------------------------------------------------------
        */

        const arrayToInput =
            (
                items
            ) =>
                Array.isArray(
                    items
                )
                    ? items.join(
                        ", "
                    )
                    : "";

        /*
        |--------------------------------------------------------------------------
        | DATE FORMAT
        |--------------------------------------------------------------------------
        */

        const formatDate =
            (
                value
            ) => {
                if (!value) {
                    return "—";
                }

                const date =
                    new Date(value);

                if (
                    Number.isNaN(
                        date.getTime()
                    )
                ) {
                    return "—";
                }

                return date.toLocaleDateString(
                    "en-IN",
                    {
                        day: "2-digit",
                        month:
                            "short",
                        year: "numeric",
                    }
                );
            };

        /*
        |--------------------------------------------------------------------------
        | EXPERIENCE TYPE LABEL
        |--------------------------------------------------------------------------
        */

        const experienceTypeLabel =
            (
                value
            ) =>
                EXPERIENCE_TYPES.find(
                    (
                        item
                    ) =>
                        item.value ===
                        value
                )?.label ||
                value ||
                "Other";

        /*
        |--------------------------------------------------------------------------
        | WORK MODE LABEL
        |--------------------------------------------------------------------------
        */

        const workModeLabel =
            (
                value
            ) =>
                WORK_MODES.find(
                    (
                        item
                    ) =>
                        item.value ===
                        value
                )?.label ||
                value ||
                "Other";

        /*
        |--------------------------------------------------------------------------
        | STATS
        |--------------------------------------------------------------------------
        */

        const stats =
            useMemo(
                () => ({
                    total:
                        experiences.length,

                    visible:
                        experiences.filter(
                            (
                                item
                            ) =>
                                item.isVisible ===
                                true
                        ).length,

                    featured:
                        experiences.filter(
                            (
                                item
                            ) =>
                                item.isFeatured ===
                                true
                        ).length,

                    current:
                        experiences.filter(
                            (
                                item
                            ) =>
                                item.currentlyWorking ===
                                true
                        ).length,
                }),
                [experiences]
            );

        /*
        |--------------------------------------------------------------------------
        | RENDER
        |--------------------------------------------------------------------------
        */

        return (
            <div
                style={{
                    minHeight:
                        "100vh",
                    background:
                        "#f5f1eb",
                    color:
                        "#211e1c",
                    padding:
                        "28px",
                    boxSizing:
                        "border-box",
                }}
            >
                {/* =========================================================
            LOCAL TOAST
        ========================================================= */}

                {toast && (
                    <div
                        role="status"
                        aria-live="polite"
                        style={{
                            position:
                                "fixed",
                            top:
                                "22px",
                            right:
                                "22px",
                            zIndex:
                                2000,
                            maxWidth:
                                "min(420px, calc(100vw - 32px))",
                            padding:
                                "14px 18px",
                            borderRadius:
                                "14px",
                            background:
                                toast.type ===
                                    "success"
                                    ? "#eaf7ef"
                                    : "#fff0ee",
                            color:
                                toast.type ===
                                    "success"
                                    ? "#23663e"
                                    : "#9b3025",
                            border:
                                toast.type ===
                                    "success"
                                    ? "1px solid #bfe4cb"
                                    : "1px solid #f1c2bc",
                            boxShadow:
                                "0 16px 40px rgba(33,30,28,0.14)",
                            fontSize:
                                "14px",
                            fontWeight:
                                700,
                            lineHeight:
                                1.45,
                        }}
                    >
                        {toast.message}
                    </div>
                )}

                {/* =========================================================
            CONFIRMATION MODAL
        ========================================================= */}

                {confirmation && (
                    <div
                        role="dialog"
                        aria-modal="true"
                        aria-labelledby="experience-confirm-title"
                        onKeyDown={(
                            event
                        ) => {
                            if (
                                event.key ===
                                "Escape"
                            ) {
                                setConfirmation(
                                    null
                                );
                            }

                            if (
                                event.key ===
                                "Enter"
                            ) {
                                event.preventDefault();

                                confirmation.onConfirm();
                            }
                        }}
                        tabIndex={-1}
                        style={{
                            position:
                                "fixed",
                            inset: 0,
                            zIndex:
                                2100,
                            display:
                                "flex",
                            alignItems:
                                "center",
                            justifyContent:
                                "center",
                            padding:
                                "20px",
                            background:
                                "rgba(25,22,20,0.48)",
                            backdropFilter:
                                "blur(7px)",
                        }}
                    >
                        <div
                            onClick={(
                                event
                            ) =>
                                event.stopPropagation()
                            }
                            style={{
                                width:
                                    "min(470px, 100%)",
                                background:
                                    "#fffdfa",
                                borderRadius:
                                    "22px",
                                padding:
                                    "28px",
                                boxShadow:
                                    "0 28px 70px rgba(20,16,13,0.25)",
                                border:
                                    "1px solid rgba(42,35,30,0.09)",
                            }}
                        >
                            <div
                                style={{
                                    width:
                                        "48px",
                                    height:
                                        "48px",
                                    borderRadius:
                                        "15px",
                                    display:
                                        "flex",
                                    alignItems:
                                        "center",
                                    justifyContent:
                                        "center",
                                    background:
                                        confirmation.danger
                                            ? "#fff0ee"
                                            : "#fff5e8",
                                    fontSize:
                                        "23px",
                                    marginBottom:
                                        "18px",
                                }}
                            >
                                {confirmation.danger
                                    ? "🗑️"
                                    : "🔄"}
                            </div>

                            <h2
                                id="experience-confirm-title"
                                style={{
                                    margin:
                                        "0 0 9px",
                                    fontSize:
                                        "23px",
                                    lineHeight:
                                        1.2,
                                }}
                            >
                                {
                                    confirmation.title
                                }
                            </h2>

                            <p
                                style={{
                                    margin:
                                        "0",
                                    color:
                                        "#756d66",
                                    fontSize:
                                        "14px",
                                    lineHeight:
                                        1.65,
                                }}
                            >
                                {
                                    confirmation.message
                                }
                            </p>

                            <div
                                style={{
                                    display:
                                        "flex",
                                    justifyContent:
                                        "flex-end",
                                    gap:
                                        "10px",
                                    marginTop:
                                        "25px",
                                    flexWrap:
                                        "wrap",
                                }}
                            >
                                <button
                                    type="button"
                                    onClick={() =>
                                        setConfirmation(
                                            null
                                        )
                                    }
                                    style={{
                                        border:
                                            "1px solid rgba(42,35,30,0.13)",
                                        background:
                                            "#fffdfa",
                                        color:
                                            "#4b4540",
                                        padding:
                                            "11px 17px",
                                        borderRadius:
                                            "11px",
                                        fontWeight:
                                            700,
                                        cursor:
                                            "pointer",
                                    }}
                                >
                                    {
                                        confirmation.cancelText
                                    }
                                </button>

                                <button
                                    type="button"
                                    onClick={() =>
                                        confirmation.onConfirm()
                                    }
                                    style={{
                                        border:
                                            "none",
                                        background:
                                            confirmation.danger
                                                ? "#c94b3e"
                                                : "#ff6f5b",
                                        color:
                                            "#ffffff",
                                        padding:
                                            "11px 18px",
                                        borderRadius:
                                            "11px",
                                        fontWeight:
                                            800,
                                        cursor:
                                            "pointer",
                                    }}
                                >
                                    {
                                        confirmation.confirmText
                                    }
                                </button>
                            </div>
                        </div>
                    </div>
                )}

                {/* =========================================================
            PAGE HEADER
        ========================================================= */}

                <div
                    style={{
                        maxWidth:
                            "1500px",
                        margin:
                            "0 auto",
                    }}
                >
                    <div
                        style={{
                            display:
                                "flex",
                            alignItems:
                                "flex-start",
                            justifyContent:
                                "space-between",
                            gap:
                                "20px",
                            marginBottom:
                                "25px",
                            flexWrap:
                                "wrap",
                        }}
                    >
                        <div
                            style={{
                                minWidth:
                                    0,
                            }}
                        >
                            {/* BACK BUTTON */}

                            <button
                                type="button"
                                onClick={() =>
                                    window.location.href =
                                    "/admin/dashboard"
                                }
                                style={{
                                    border:
                                        "1px solid rgba(42,35,30,0.12)",
                                    background:
                                        "#fffdfa",
                                    color:
                                        "#4b4540",
                                    padding:
                                        "9px 14px",
                                    borderRadius:
                                        "10px",
                                    fontWeight:
                                        800,
                                    cursor:
                                        "pointer",
                                    marginBottom:
                                        "16px",
                                }}
                            >
                                ← Back
                            </button>

                            <div
                                style={{
                                    color:
                                        "#ff6f5b",
                                    fontSize:
                                        "12px",
                                    fontWeight:
                                        900,
                                    letterSpacing:
                                        "0.13em",
                                    textTransform:
                                        "uppercase",
                                    marginBottom:
                                        "9px",
                                }}
                            >
                                Professional Journey
                            </div>

                            <h1
                                style={{
                                    margin:
                                        0,
                                    fontSize:
                                        "clamp(30px, 4vw, 48px)",
                                    lineHeight:
                                        1.05,
                                    letterSpacing:
                                        "-0.035em",
                                }}
                            >
                                Experience
                            </h1>

                            <p
                                style={{
                                    margin:
                                        "11px 0 0",
                                    color:
                                        "#756d66",
                                    maxWidth:
                                        "720px",
                                    lineHeight:
                                        1.65,
                                    fontSize:
                                        "14px",
                                }}
                            >
                                Manage internships, jobs,
                                professional experience,
                                responsibilities,
                                technologies, skills and
                                supporting documents.
                            </p>
                        </div>

                        <button
                            type="button"
                            onClick={
                                openCreateForm
                            }
                            style={{
                                border:
                                    "none",
                                background:
                                    "#ff6f5b",
                                color:
                                    "#ffffff",
                                padding:
                                    "13px 19px",
                                borderRadius:
                                    "13px",
                                fontWeight:
                                    800,
                                cursor:
                                    "pointer",
                                boxShadow:
                                    "0 12px 25px rgba(255,111,91,0.22)",
                                whiteSpace:
                                    "nowrap",
                            }}
                        >
                            ＋ Add Experience
                        </button>
                    </div>

                    {/* =======================================================
              STATS
          ======================================================= */}

                    <div
                        style={{
                            display:
                                "grid",
                            gridTemplateColumns:
                                "repeat(4, minmax(0, 1fr))",
                            gap:
                                "12px",
                            marginBottom:
                                "24px",
                        }}
                    >
                        {[
                            [
                                "Total",
                                stats.total,
                                "💼",
                            ],
                            [
                                "Visible",
                                stats.visible,
                                "👁️",
                            ],
                            [
                                "Featured",
                                stats.featured,
                                "⭐",
                            ],
                            [
                                "Current",
                                stats.current,
                                "🟢",
                            ],
                        ].map(
                            (
                                item
                            ) => (
                                <div
                                    key={
                                        item[0]
                                    }
                                    style={{
                                        background:
                                            "#fffdfa",
                                        border:
                                            "1px solid rgba(42,35,30,0.08)",
                                        borderRadius:
                                            "16px",
                                        padding:
                                            "16px",
                                        minWidth:
                                            0,
                                    }}
                                >
                                    <div
                                        style={{
                                            display:
                                                "flex",
                                            justifyContent:
                                                "space-between",
                                            alignItems:
                                                "center",
                                            gap:
                                                "8px",
                                        }}
                                    >
                                        <span
                                            style={{
                                                color:
                                                    "#756d66",
                                                fontSize:
                                                    "12px",
                                                fontWeight:
                                                    700,
                                            }}
                                        >
                                            {
                                                item[0]
                                            }
                                        </span>

                                        <span
                                            style={{
                                                fontSize:
                                                    "18px",
                                            }}
                                        >
                                            {
                                                item[2]
                                            }
                                        </span>
                                    </div>

                                    <strong
                                        style={{
                                            display:
                                                "block",
                                            marginTop:
                                                "8px",
                                            fontSize:
                                                "26px",
                                        }}
                                    >
                                        {
                                            item[1]
                                        }
                                    </strong>
                                </div>
                            )
                        )}
                    </div>

                    {/* =======================================================
              CREATE / EDIT FORM
          ======================================================= */}

                    {showForm && (
                        <form
                            onSubmit={
                                saveExperience
                            }
                            style={{
                                background:
                                    "#fffdfa",
                                border:
                                    "1px solid rgba(42,35,30,0.09)",
                                borderRadius:
                                    "22px",
                                padding:
                                    "24px",
                                marginBottom:
                                    "25px",
                                boxShadow:
                                    "0 16px 42px rgba(42,35,30,0.06)",
                            }}
                        >
                            <div
                                style={{
                                    display:
                                        "flex",
                                    justifyContent:
                                        "space-between",
                                    alignItems:
                                        "center",
                                    gap:
                                        "12px",
                                    marginBottom:
                                        "22px",
                                    flexWrap:
                                        "wrap",
                                }}
                            >
                                <div>
                                    <h2
                                        style={{
                                            margin:
                                                0,
                                            fontSize:
                                                "24px",
                                        }}
                                    >
                                        {editingExperienceId
                                            ? "Edit Experience ✏️"
                                            : "Add Experience 💼"}
                                    </h2>

                                    <p
                                        style={{
                                            margin:
                                                "6px 0 0",
                                            color:
                                                "#756d66",
                                            fontSize:
                                                "13px",
                                        }}
                                    >
                                        Fields marked with *
                                        are required.
                                    </p>
                                </div>

                                <button
                                    type="button"
                                    onClick={
                                        closeForm
                                    }
                                    style={{
                                        border:
                                            "1px solid rgba(42,35,30,0.12)",
                                        background:
                                            "#fffdfa",
                                        color:
                                            "#4b4540",
                                        padding:
                                            "9px 13px",
                                        borderRadius:
                                            "10px",
                                        fontWeight:
                                            700,
                                        cursor:
                                            "pointer",
                                    }}
                                >
                                    ✕ Close
                                </button>
                            </div>

                            {/* =================================================
                  COMPANY INFORMATION
              ================================================= */}

                            <div
                                style={{
                                    display:
                                        "grid",
                                    gridTemplateColumns:
                                        "repeat(2, minmax(0, 1fr))",
                                    gap:
                                        "16px",
                                }}
                            >
                                <label
                                    style={{
                                        display:
                                            "grid",
                                        gap:
                                            "7px",
                                    }}
                                >
                                    <span
                                        style={{
                                            fontSize:
                                                "12px",
                                            fontWeight:
                                                800,
                                        }}
                                    >
                                        Company Name *
                                    </span>

                                    <input
                                        name="companyName"
                                        value={
                                            form.companyName
                                        }
                                        onChange={
                                            handleChange
                                        }
                                        placeholder="Company / Organization name"
                                        required
                                        maxLength={200}
                                        style={inputStyle}
                                    />
                                </label>

                                <label
                                    style={{
                                        display:
                                            "grid",
                                        gap:
                                            "7px",
                                    }}
                                >
                                    <span
                                        style={{
                                            fontSize:
                                                "12px",
                                            fontWeight:
                                                800,
                                        }}
                                    >
                                        Company Website
                                    </span>

                                    <input
                                        type="url"
                                        name="companyWebsite"
                                        value={
                                            form.companyWebsite
                                        }
                                        onChange={
                                            handleChange
                                        }
                                        placeholder="https://company.com"
                                        style={inputStyle}
                                    />
                                </label>

                                <label
                                    style={{
                                        display:
                                            "grid",
                                        gap:
                                            "7px",
                                    }}
                                >
                                    <span
                                        style={{
                                            fontSize:
                                                "12px",
                                            fontWeight:
                                                800,
                                        }}
                                    >
                                        Role / Designation *
                                    </span>

                                    <input
                                        name="role"
                                        value={
                                            form.role
                                        }
                                        onChange={
                                            handleChange
                                        }
                                        placeholder="Java Developer Intern"
                                        required
                                        maxLength={200}
                                        style={inputStyle}
                                    />
                                </label>

                                <label
                                    style={{
                                        display:
                                            "grid",
                                        gap:
                                            "7px",
                                    }}
                                >
                                    <span
                                        style={{
                                            fontSize:
                                                "12px",
                                            fontWeight:
                                                800,
                                        }}
                                    >
                                        Experience Type *
                                    </span>

                                    <select
                                        name="experienceType"
                                        value={
                                            form.experienceType
                                        }
                                        onChange={
                                            handleChange
                                        }
                                        style={
                                            inputStyle
                                        }
                                    >
                                        {EXPERIENCE_TYPES.map(
                                            (
                                                item
                                            ) => (
                                                <option
                                                    key={
                                                        item.value
                                                    }
                                                    value={
                                                        item.value
                                                    }
                                                >
                                                    {
                                                        item.label
                                                    }
                                                </option>
                                            )
                                        )}
                                    </select>
                                </label>

                                {/* =================================================
                    TIMELINE
                ================================================= */}

                                <label
                                    style={{
                                        display:
                                            "grid",
                                        gap:
                                            "7px",
                                    }}
                                >
                                    <span
                                        style={{
                                            fontSize:
                                                "12px",
                                            fontWeight:
                                                800,
                                        }}
                                    >
                                        Start Date *
                                    </span>

                                    <input
                                        type="date"
                                        name="startDate"
                                        value={
                                            form.startDate
                                        }
                                        onChange={
                                            handleChange
                                        }
                                        required
                                        style={inputStyle}
                                    />
                                </label>

                                <label
                                    style={{
                                        display:
                                            "grid",
                                        gap:
                                            "7px",
                                    }}
                                >
                                    <span
                                        style={{
                                            fontSize:
                                                "12px",
                                            fontWeight:
                                                800,
                                        }}
                                    >
                                        End Date
                                    </span>

                                    <input
                                        type="date"
                                        name="endDate"
                                        value={
                                            form.endDate
                                        }
                                        onChange={
                                            handleChange
                                        }
                                        disabled={
                                            form.currentlyWorking
                                        }
                                        style={{
                                            ...inputStyle,
                                            opacity:
                                                form.currentlyWorking
                                                    ? 0.55
                                                    : 1,
                                        }}
                                    />
                                </label>

                                <label
                                    style={{
                                        display:
                                            "flex",
                                        alignItems:
                                            "center",
                                        gap:
                                            "10px",
                                        minHeight:
                                            "44px",
                                        padding:
                                            "10px 12px",
                                        border:
                                            "1px solid rgba(42,35,30,0.10)",
                                        borderRadius:
                                            "11px",
                                        background:
                                            "#fffdfa",
                                        cursor:
                                            "pointer",
                                    }}
                                >
                                    <input
                                        type="checkbox"
                                        name="currentlyWorking"
                                        checked={
                                            form.currentlyWorking
                                        }
                                        onChange={
                                            handleChange
                                        }
                                    />

                                    <span
                                        style={{
                                            fontSize:
                                                "13px",
                                            fontWeight:
                                                700,
                                        }}
                                    >
                                        🟢 Currently Working / Ongoing
                                    </span>
                                </label>

                                <label
                                    style={{
                                        display:
                                            "grid",
                                        gap:
                                            "7px",
                                    }}
                                >
                                    <span
                                        style={{
                                            fontSize:
                                                "12px",
                                            fontWeight:
                                                800,
                                        }}
                                    >
                                        Duration
                                    </span>

                                    <input
                                        name="duration"
                                        value={
                                            form.duration
                                        }
                                        onChange={
                                            handleChange
                                        }
                                        placeholder="e.g. 2 Months"
                                        maxLength={100}
                                        style={inputStyle}
                                    />
                                </label>

                                {/* =================================================
                    LOCATION / WORK MODE
                ================================================= */}

                                <label
                                    style={{
                                        display:
                                            "grid",
                                        gap:
                                            "7px",
                                    }}
                                >
                                    <span
                                        style={{
                                            fontSize:
                                                "12px",
                                            fontWeight:
                                                800,
                                        }}
                                    >
                                        Location
                                    </span>

                                    <input
                                        name="location"
                                        value={
                                            form.location
                                        }
                                        onChange={
                                            handleChange
                                        }
                                        placeholder="Dehradun, India"
                                        maxLength={200}
                                        style={inputStyle}
                                    />
                                </label>

                                <label
                                    style={{
                                        display:
                                            "grid",
                                        gap:
                                            "7px",
                                    }}
                                >
                                    <span
                                        style={{
                                            fontSize:
                                                "12px",
                                            fontWeight:
                                                800,
                                        }}
                                    >
                                        Work Mode
                                    </span>

                                    <select
                                        name="workMode"
                                        value={
                                            form.workMode
                                        }
                                        onChange={
                                            handleChange
                                        }
                                        style={
                                            inputStyle
                                        }
                                    >
                                        {WORK_MODES.map(
                                            (
                                                item
                                            ) => (
                                                <option
                                                    key={
                                                        item.value
                                                    }
                                                    value={
                                                        item.value
                                                    }
                                                >
                                                    {
                                                        item.label
                                                    }
                                                </option>
                                            )
                                        )}
                                    </select>
                                </label>

                                {/* =================================================
                    DESCRIPTION
                ================================================= */}

                                <label
                                    style={{
                                        display:
                                            "grid",
                                        gap:
                                            "7px",
                                        gridColumn:
                                            "1 / -1",
                                    }}
                                >
                                    <span
                                        style={{
                                            fontSize:
                                                "12px",
                                            fontWeight:
                                                800,
                                        }}
                                    >
                                        Description
                                    </span>

                                    <textarea
                                        name="description"
                                        value={
                                            form.description
                                        }
                                        onChange={
                                            handleChange
                                        }
                                        placeholder="Briefly describe this professional experience..."
                                        maxLength={3000}
                                        rows={5}
                                        style={{
                                            ...inputStyle,
                                            resize:
                                                "vertical",
                                        }}
                                    />
                                </label>

                                {/* =================================================
                    RESPONSIBILITIES
                ================================================= */}

                                <label
                                    style={{
                                        display:
                                            "grid",
                                        gap:
                                            "7px",
                                    }}
                                >
                                    <span
                                        style={{
                                            fontSize:
                                                "12px",
                                            fontWeight:
                                                800,
                                        }}
                                    >
                                        Responsibilities
                                    </span>

                                    <textarea
                                        value={
                                            Array.isArray(
                                                form.responsibilities
                                            )
                                                ? form.responsibilities.join(
                                                    "\n"
                                                )
                                                : ""
                                        }
                                        onChange={(
                                            event
                                        ) =>
                                            handleArrayChange(
                                                "responsibilities",
                                                event
                                                    .target
                                                    .value
                                            )
                                        }
                                        placeholder="One responsibility per line"
                                        rows={5}
                                        style={{
                                            ...inputStyle,
                                            resize:
                                                "vertical",
                                        }}
                                    />
                                    <small
                                        style={{
                                            color:
                                                "#8a827b",
                                            fontSize:
                                                "11px",
                                        }}
                                    >
                                        Enter each responsibility on a new line.
                                    </small>
                                </label>

                                {/* =================================================
                    TECHNOLOGIES
                ================================================= */}

                                <label
                                    style={{
                                        display:
                                            "grid",
                                        gap:
                                            "7px",
                                    }}
                                >
                                    <span
                                        style={{
                                            fontSize:
                                                "12px",
                                            fontWeight:
                                                800,
                                        }}
                                    >
                                        Technologies
                                    </span>

                                    <textarea
                                        value={arrayToInput(
                                            form.technologies
                                        )}
                                        onChange={(
                                            event
                                        ) =>
                                            handleArrayChange(
                                                "technologies",
                                                event
                                                    .target
                                                    .value
                                            )
                                        }
                                        placeholder="CSV: Java, Spring Boot, MySQL, Maven"
                                        rows={5}
                                        style={{
                                            ...inputStyle,
                                            resize:
                                                "vertical",
                                        }}
                                    />
                                    <small
                                        style={{
                                            color:
                                                "#8a827b",
                                            fontSize:
                                                "11px",
                                        }}
                                    >
                                        Separate items with
                                        commas.
                                    </small>
                                </label>

                                {/* =================================================
                    SKILLS
                ================================================= */}

                                <label
                                    style={{
                                        display:
                                            "grid",
                                        gap:
                                            "7px",
                                    }}
                                >
                                    <span
                                        style={{
                                            fontSize:
                                                "12px",
                                            fontWeight:
                                                800,
                                        }}
                                    >
                                        Skills Gained
                                    </span>

                                    <textarea
                                        value={arrayToInput(
                                            form.skills
                                        )}
                                        onChange={(
                                            event
                                        ) =>
                                            handleArrayChange(
                                                "skills",
                                                event
                                                    .target
                                                    .value
                                            )
                                        }
                                        placeholder="CSV: REST API, Debugging, Git"
                                        rows={5}
                                        style={{
                                            ...inputStyle,
                                            resize:
                                                "vertical",
                                        }}
                                    />
                                    <small
                                        style={{
                                            color:
                                                "#8a827b",
                                            fontSize:
                                                "11px",
                                        }}
                                    >
                                        Separate items with
                                        commas.
                                    </small>
                                </label>

                                {/* =================================================
                    RELATED PROJECT
                ================================================= */}

                                <label
                                    style={{
                                        display:
                                            "grid",
                                        gap:
                                            "7px",
                                    }}
                                >
                                    <span
                                        style={{
                                            fontSize:
                                                "12px",
                                            fontWeight:
                                                800,
                                        }}
                                    >
                                        Related Project ID
                                    </span>

                                    <input
                                        name="relatedProject"
                                        value={
                                            form.relatedProject
                                        }
                                        onChange={
                                            handleChange
                                        }
                                        placeholder="MongoDB Project ObjectId (optional)"
                                        style={
                                            inputStyle
                                        }
                                    />

                                    <small
                                        style={{
                                            color:
                                                "#8a827b",
                                            fontSize:
                                                "11px",
                                        }}
                                    >
                                        Optional. Backend validates
                                        this as a Project ID.
                                    </small>
                                </label>

                                {/* =================================================
                    CERTIFICATE URL
                ================================================= */}

                                <label
                                    style={{
                                        display:
                                            "grid",
                                        gap:
                                            "7px",
                                    }}
                                >
                                    <span
                                        style={{
                                            fontSize:
                                                "12px",
                                            fontWeight:
                                                800,
                                        }}
                                    >
                                        Certificate / Verification URL
                                    </span>

                                    <input
                                        type="url"
                                        name="certificateUrl"
                                        value={
                                            form.certificateUrl
                                        }
                                        onChange={
                                            handleChange
                                        }
                                        placeholder="https://..."
                                        style={
                                            inputStyle
                                        }
                                    />
                                </label>

                                {/* =================================================
                    DISPLAY ORDER
                ================================================= */}

                                <label
                                    style={{
                                        display:
                                            "grid",
                                        gap:
                                            "7px",
                                    }}
                                >
                                    <span
                                        style={{
                                            fontSize:
                                                "12px",
                                            fontWeight:
                                                800,
                                        }}
                                    >
                                        Display Order
                                    </span>

                                    <input
                                        type="number"
                                        name="displayOrder"
                                        value={
                                            form.displayOrder
                                        }
                                        onChange={
                                            handleChange
                                        }
                                        min="0"
                                        step="1"
                                        style={
                                            inputStyle
                                        }
                                    />
                                </label>

                                {/* =================================================
                    DISPLAY CONTROLS
                ================================================= */}

                                <div
                                    style={{
                                        display:
                                            "grid",
                                        gap:
                                            "9px",
                                        alignContent:
                                            "start",
                                    }}
                                >
                                    <label
                                        style={{
                                            display:
                                                "flex",
                                            alignItems:
                                                "center",
                                            gap:
                                                "9px",
                                            fontSize:
                                                "13px",
                                            fontWeight:
                                                700,
                                        }}
                                    >
                                        <input
                                            type="checkbox"
                                            name="isVisible"
                                            checked={
                                                form.isVisible
                                            }
                                            onChange={
                                                handleChange
                                            }
                                        />
                                        👁️ Show on public portfolio
                                    </label>

                                    <label
                                        style={{
                                            display:
                                                "flex",
                                            alignItems:
                                                "center",
                                            gap:
                                                "9px",
                                            fontSize:
                                                "13px",
                                            fontWeight:
                                                700,
                                        }}
                                    >
                                        <input
                                            type="checkbox"
                                            name="isFeatured"
                                            checked={
                                                form.isFeatured
                                            }
                                            onChange={
                                                handleChange
                                            }
                                        />
                                        ⭐ Mark as featured
                                    </label>

                                    <label
                                        style={{
                                            display:
                                                "flex",
                                            alignItems:
                                                "center",
                                            gap:
                                                "9px",
                                            fontSize:
                                                "13px",
                                            fontWeight:
                                                700,
                                        }}
                                    >
                                        <input
                                            type="checkbox"
                                            name="isActive"
                                            checked={
                                                form.isActive
                                            }
                                            onChange={
                                                handleChange
                                            }
                                        />
                                        🟢 Active
                                    </label>
                                </div>
                            </div>

                            {/* =================================================
                  SAVE BUTTONS
              ================================================= */}

                            <div
                                style={{
                                    display:
                                        "flex",
                                    justifyContent:
                                        "flex-end",
                                    gap:
                                        "10px",
                                    marginTop:
                                        "22px",
                                    paddingTop:
                                        "20px",
                                    borderTop:
                                        "1px solid rgba(42,35,30,0.08)",
                                    flexWrap:
                                        "wrap",
                                }}
                            >
                                <button
                                    type="button"
                                    onClick={
                                        closeForm
                                    }
                                    disabled={
                                        saving
                                    }
                                    style={{
                                        border:
                                            "1px solid rgba(42,35,30,0.12)",
                                        background:
                                            "#fffdfa",
                                        color:
                                            "#4b4540",
                                        padding:
                                            "12px 18px",
                                        borderRadius:
                                            "11px",
                                        fontWeight:
                                            700,
                                        cursor:
                                            saving
                                                ? "not-allowed"
                                                : "pointer",
                                        opacity:
                                            saving
                                                ? 0.6
                                                : 1,
                                    }}
                                >
                                    Cancel
                                </button>

                                <button
                                    type="submit"
                                    disabled={
                                        saving
                                    }
                                    style={{
                                        border:
                                            "none",
                                        background:
                                            "#ff6f5b",
                                        color:
                                            "#ffffff",
                                        padding:
                                            "12px 20px",
                                        borderRadius:
                                            "11px",
                                        fontWeight:
                                            800,
                                        cursor:
                                            saving
                                                ? "not-allowed"
                                                : "pointer",
                                        opacity:
                                            saving
                                                ? 0.65
                                                : 1,
                                    }}
                                >
                                    {saving
                                        ? "Saving..."
                                        : editingExperienceId
                                            ? "✏️ Update Experience"
                                            : "＋ Create Experience"}
                                </button>
                            </div>
                        </form>
                    )}

                    {/* =======================================================
              SEARCH / FILTER
          ======================================================= */}

                    <div
                        style={{
                            background:
                                "#fffdfa",
                            border:
                                "1px solid rgba(42,35,30,0.08)",
                            borderRadius:
                                "17px",
                            padding:
                                "14px",
                            display:
                                "grid",
                            gridTemplateColumns:
                                "minmax(220px, 1fr) auto",
                            gap:
                                "10px",
                            marginBottom:
                                "18px",
                        }}
                    >
                        <input
                            value={
                                searchTerm
                            }
                            onChange={(
                                event
                            ) =>
                                setSearchTerm(
                                    event.target
                                        .value
                                )
                            }
                            placeholder="🔎 Search company, role, technology, skill..."
                            style={
                                inputStyle
                            }
                        />

                        <select
                            value={
                                filter
                            }
                            onChange={(
                                event
                            ) =>
                                setFilter(
                                    event.target
                                        .value
                                )
                            }
                            style={{
                                ...inputStyle,
                                minWidth:
                                    "170px",
                            }}
                        >
                            <option value="all">
                                All Experiences
                            </option>
                            <option value="visible">
                                Visible
                            </option>
                            <option value="hidden">
                                Hidden
                            </option>
                            <option value="featured">
                                Featured
                            </option>
                            <option value="inactive">
                                Inactive
                            </option>
                        </select>
                    </div>

                    {/* =======================================================
              LOADING
          ======================================================= */}

                    {loading ? (
                        <div
                            style={{
                                background:
                                    "#fffdfa",
                                border:
                                    "1px solid rgba(42,35,30,0.08)",
                                borderRadius:
                                    "20px",
                                padding:
                                    "60px 20px",
                                textAlign:
                                    "center",
                                color:
                                    "#756d66",
                            }}
                        >
                            <div
                                style={{
                                    fontSize:
                                        "30px",
                                    marginBottom:
                                        "10px",
                                }}
                            >
                                ⏳
                            </div>

                            Loading experiences...
                        </div>
                    ) : filteredExperiences.length ===
                        0 ? (
                        <div
                            style={{
                                background:
                                    "#fffdfa",
                                border:
                                    "1px solid rgba(42,35,30,0.08)",
                                borderRadius:
                                    "20px",
                                padding:
                                    "60px 20px",
                                textAlign:
                                    "center",
                            }}
                        >
                            <div
                                style={{
                                    fontSize:
                                        "42px",
                                    marginBottom:
                                        "12px",
                                }}
                            >
                                💼
                            </div>

                            <h2
                                style={{
                                    margin:
                                        "0 0 8px",
                                    fontSize:
                                        "22px",
                                }}
                            >
                                No Experience Records
                            </h2>

                            <p
                                style={{
                                    margin:
                                        "0 auto 20px",
                                    maxWidth:
                                        "500px",
                                    color:
                                        "#756d66",
                                    lineHeight:
                                        1.6,
                                }}
                            >
                                {searchTerm ||
                                    filter !==
                                    "all"
                                    ? "No experience matches the current search or filter."
                                    : "Add your first internship or professional experience."}
                            </p>

                            {!searchTerm &&
                                filter ===
                                "all" && (
                                    <button
                                        type="button"
                                        onClick={
                                            openCreateForm
                                        }
                                        style={{
                                            border:
                                                "none",
                                            background:
                                                "#ff6f5b",
                                            color:
                                                "#ffffff",
                                            padding:
                                                "12px 18px",
                                            borderRadius:
                                                "11px",
                                            fontWeight:
                                                800,
                                            cursor:
                                                "pointer",
                                        }}
                                    >
                                        ＋ Add Experience
                                    </button>
                                )}
                        </div>
                    ) : (
                        /* =====================================================
                           EXPERIENCE LIST
                        ===================================================== */

                        <div
                            style={{
                                display:
                                    "grid",
                                gap:
                                    "16px",
                            }}
                        >
                            {filteredExperiences.map(
                                (
                                    experience
                                ) => {
                                    const experienceId =
                                        String(
                                            experience._id ||
                                            experience.id
                                        );

                                    const documents =
                                        Array.isArray(
                                            experience.documents
                                        )
                                            ? experience.documents
                                            : [];

                                    return (
                                        <article
                                            key={
                                                experienceId
                                            }
                                            style={{
                                                background:
                                                    "#fffdfa",
                                                border:
                                                    "1px solid rgba(42,35,30,0.08)",
                                                borderRadius:
                                                    "20px",
                                                padding:
                                                    "20px",
                                                boxShadow:
                                                    "0 10px 30px rgba(42,35,30,0.045)",
                                                minWidth:
                                                    0,
                                            }}
                                        >
                                            {/* =================================================
                          CARD HEADER
                      ================================================= */}

                                            <div
                                                style={{
                                                    display:
                                                        "flex",
                                                    justifyContent:
                                                        "space-between",
                                                    alignItems:
                                                        "flex-start",
                                                    gap:
                                                        "16px",
                                                    flexWrap:
                                                        "wrap",
                                                }}
                                            >
                                                <div
                                                    style={{
                                                        minWidth:
                                                            0,
                                                        flex:
                                                            "1 1 420px",
                                                    }}
                                                >
                                                    <div
                                                        style={{
                                                            display:
                                                                "flex",
                                                            gap:
                                                                "7px",
                                                            flexWrap:
                                                                "wrap",
                                                            marginBottom:
                                                                "8px",
                                                        }}
                                                    >
                                                        {experience.isFeatured && (
                                                            <span
                                                                style={
                                                                    badgeStyle(
                                                                        "#fff4df",
                                                                        "#8a5b16"
                                                                    )
                                                                }
                                                            >
                                                                ⭐ Featured
                                                            </span>
                                                        )}

                                                        {experience.isVisible ? (
                                                            <span
                                                                style={
                                                                    badgeStyle(
                                                                        "#eaf7ef",
                                                                        "#23663e"
                                                                    )
                                                                }
                                                            >
                                                                👁️ Public
                                                            </span>
                                                        ) : (
                                                            <span
                                                                style={
                                                                    badgeStyle(
                                                                        "#f1efec",
                                                                        "#756d66"
                                                                    )
                                                                }
                                                            >
                                                                🙈 Hidden
                                                            </span>
                                                        )}

                                                        {experience.isActive ? (
                                                            <span
                                                                style={
                                                                    badgeStyle(
                                                                        "#eaf7ef",
                                                                        "#23663e"
                                                                    )
                                                                }
                                                            >
                                                                🟢 Active
                                                            </span>
                                                        ) : (
                                                            <span
                                                                style={
                                                                    badgeStyle(
                                                                        "#f1efec",
                                                                        "#756d66"
                                                                    )
                                                                }
                                                            >
                                                                ⚪ Inactive
                                                            </span>
                                                        )}
                                                    </div>

                                                    <h2
                                                        style={{
                                                            margin:
                                                                0,
                                                            fontSize:
                                                                "clamp(20px, 2.4vw, 28px)",
                                                            lineHeight:
                                                                1.2,
                                                            overflowWrap:
                                                                "anywhere",
                                                        }}
                                                    >
                                                        {
                                                            experience.role
                                                        }
                                                    </h2>

                                                    <div
                                                        style={{
                                                            marginTop:
                                                                "7px",
                                                            fontSize:
                                                                "15px",
                                                            fontWeight:
                                                                800,
                                                            color:
                                                                "#ff6f5b",
                                                            overflowWrap:
                                                                "anywhere",
                                                        }}
                                                    >
                                                        {
                                                            experience.companyName
                                                        }
                                                    </div>

                                                    <div
                                                        style={{
                                                            display:
                                                                "flex",
                                                            gap:
                                                                "7px",
                                                            flexWrap:
                                                                "wrap",
                                                            marginTop:
                                                                "10px",
                                                            color:
                                                                "#756d66",
                                                            fontSize:
                                                                "12px",
                                                        }}
                                                    >
                                                        <span>
                                                            💼{" "}
                                                            {
                                                                experienceTypeLabel(
                                                                    experience.experienceType
                                                                )
                                                            }
                                                        </span>

                                                        <span>
                                                            •
                                                        </span>

                                                        <span>
                                                            📅{" "}
                                                            {formatDate(
                                                                experience.startDate
                                                            )}{" "}
                                                            —{" "}
                                                            {experience.currentlyWorking
                                                                ? "Present"
                                                                : formatDate(
                                                                    experience.endDate
                                                                )}
                                                        </span>

                                                        {experience.duration && (
                                                            <>
                                                                <span>
                                                                    •
                                                                </span>

                                                                <span>
                                                                    ⏱️{" "}
                                                                    {
                                                                        experience.duration
                                                                    }
                                                                </span>
                                                            </>
                                                        )}
                                                    </div>
                                                </div>

                                                {/* =================================================
                            ACTIONS
                        ================================================= */}

                                                <div
                                                    style={{
                                                        display:
                                                            "flex",
                                                        gap:
                                                            "7px",
                                                        flexWrap:
                                                            "wrap",
                                                    }}
                                                >
                                                    <button
                                                        type="button"
                                                        onClick={() =>
                                                            openEditForm(
                                                                experience
                                                            )
                                                        }
                                                        style={
                                                            smallActionStyle
                                                        }
                                                    >
                                                        ✏️ Edit
                                                    </button>

                                                    <button
                                                        type="button"
                                                        onClick={() =>
                                                            requestDeleteExperience(
                                                                experience
                                                            )
                                                        }
                                                        disabled={
                                                            deletingId ===
                                                            experienceId
                                                        }
                                                        style={{
                                                            ...smallActionStyle,
                                                            color:
                                                                "#a63d32",
                                                            background:
                                                                "#fff0ee",
                                                        }}
                                                    >
                                                        {deletingId ===
                                                            experienceId
                                                            ? "Deleting..."
                                                            : "🗑️ Delete"}
                                                    </button>
                                                </div>
                                            </div>

                                            {/* =================================================
                          BASIC DETAILS
                      ================================================= */}

                                            <div
                                                style={{
                                                    display:
                                                        "grid",
                                                    gridTemplateColumns:
                                                        "repeat(3, minmax(0, 1fr))",
                                                    gap:
                                                        "10px",
                                                    marginTop:
                                                        "18px",
                                                }}
                                            >
                                                <div
                                                    style={
                                                        detailBoxStyle
                                                    }
                                                >
                                                    <div
                                                        style={{
                                                            display: "flex",
                                                            alignItems: "center",
                                                            gap: "8px",
                                                            flexWrap: "wrap",
                                                        }}
                                                    >
                                                        <span>
                                                            📍 Location
                                                        </span>

                                                        <strong>
                                                            {
                                                                experience.location ||
                                                                "Not specified"
                                                            }
                                                        </strong>
                                                    </div>
                                                </div>

                                                <div
                                                    style={
                                                        detailBoxStyle
                                                    }
                                                >
                                                    <div
                                                        style={{
                                                            display: "flex",
                                                            alignItems: "center",
                                                            gap: "8px",
                                                            flexWrap: "wrap",
                                                        }}
                                                    >
                                                        <span>
                                                            🏢 Work Mode
                                                        </span>

                                                        <strong>
                                                            {
                                                                workModeLabel(
                                                                    experience.workMode
                                                                )
                                                            }
                                                        </strong>
                                                    </div>
                                                </div>

                                                <div
                                                    style={
                                                        detailBoxStyle
                                                    }
                                                >
                                                    <span>
                                                        ↕️ Display Order
                                                    </span>

                                                    <input
                                                        type="number"
                                                        min="0"
                                                        step="1"
                                                        defaultValue={
                                                            Number(
                                                                experience.displayOrder ||
                                                                0
                                                            )
                                                        }
                                                        onBlur={(
                                                            event
                                                        ) =>
                                                            updateDisplayOrder(
                                                                experience,
                                                                event
                                                                    .target
                                                                    .value
                                                            )
                                                        }
                                                        style={{
                                                            width:
                                                                "100%",
                                                            border:
                                                                "1px solid rgba(42,35,30,0.10)",
                                                            borderRadius:
                                                                "8px",
                                                            padding:
                                                                "7px 8px",
                                                            background:
                                                                "#fffdfa",
                                                            boxSizing:
                                                                "border-box",
                                                        }}
                                                    />
                                                </div>
                                            </div>

                                            {/* =================================================
                          DESCRIPTION
                      ================================================= */}

                                            {experience.description && (
                                                <div
                                                    style={{
                                                        marginTop:
                                                            "17px",
                                                    }}
                                                >
                                                    <div
                                                        style={
                                                            sectionLabelStyle
                                                        }
                                                    >
                                                        Description
                                                    </div>

                                                    <p
                                                        style={{
                                                            margin:
                                                                "7px 0 0",
                                                            color:
                                                                "#5f5852",
                                                            lineHeight:
                                                                1.7,
                                                            fontSize:
                                                                "13px",
                                                            whiteSpace:
                                                                "pre-wrap",
                                                            overflowWrap:
                                                                "anywhere",
                                                        }}
                                                    >
                                                        {
                                                            experience.description
                                                        }
                                                    </p>
                                                </div>
                                            )}

                                            {/* =================================================
                          RESPONSIBILITIES
                      ================================================= */}

                                            {Array.isArray(
                                                experience.responsibilities
                                            ) &&
                                                experience
                                                    .responsibilities
                                                    .length >
                                                0 && (
                                                    <div
                                                        style={{
                                                            marginTop:
                                                                "17px",
                                                        }}
                                                    >
                                                        <div
                                                            style={
                                                                sectionLabelStyle
                                                            }
                                                        >
                                                            Responsibilities
                                                        </div>

                                                        <ul
                                                            style={{
                                                                margin:
                                                                    "8px 0 0",
                                                                paddingLeft:
                                                                    "20px",
                                                                color:
                                                                    "#5f5852",
                                                                lineHeight:
                                                                    1.65,
                                                                fontSize:
                                                                    "13px",
                                                            }}
                                                        >
                                                            {experience.responsibilities.map(
                                                                (
                                                                    item,
                                                                    index
                                                                ) => (
                                                                    <li
                                                                        key={`${experienceId}-responsibility-${index}`}
                                                                        style={{
                                                                            marginBottom:
                                                                                "4px",
                                                                            overflowWrap:
                                                                                "anywhere",
                                                                        }}
                                                                    >
                                                                        {
                                                                            item
                                                                        }
                                                                    </li>
                                                                )
                                                            )}
                                                        </ul>
                                                    </div>
                                                )}

                                            {/* =================================================
                          TECHNOLOGIES + SKILLS
                      ================================================= */}

                                            <div
                                                style={{
                                                    display:
                                                        "grid",
                                                    gridTemplateColumns:
                                                        "repeat(2, minmax(0, 1fr))",
                                                    gap:
                                                        "16px",
                                                    marginTop:
                                                        "17px",
                                                }}
                                            >
                                                <TagSection
                                                    title="Technologies"
                                                    icon="⚙️"
                                                    items={
                                                        experience.technologies
                                                    }
                                                />

                                                <TagSection
                                                    title="Skills"
                                                    icon="🧠"
                                                    items={
                                                        experience.skills
                                                    }
                                                />
                                            </div>

                                            {/* =================================================
                          LINKS
                      ================================================= */}

                                            <div
                                                style={{
                                                    display:
                                                        "flex",
                                                    gap:
                                                        "8px",
                                                    flexWrap:
                                                        "wrap",
                                                    marginTop:
                                                        "17px",
                                                }}
                                            >
                                                {experience.companyWebsite && (
                                                    <a
                                                        href={
                                                            experience.companyWebsite
                                                        }
                                                        target="_blank"
                                                        rel="noopener noreferrer"
                                                        style={
                                                            linkStyle
                                                        }
                                                    >
                                                        🌐 Company Website
                                                    </a>
                                                )}

                                                {experience.certificateUrl && (
                                                    <a
                                                        href={
                                                            experience.certificateUrl
                                                        }
                                                        target="_blank"
                                                        rel="noopener noreferrer"
                                                        style={
                                                            linkStyle
                                                        }
                                                    >
                                                        🏆 Certificate URL
                                                    </a>
                                                )}
                                            </div>

                                            {/* =================================================
                          DOCUMENT MANAGEMENT
                      ================================================= */}

                                            <div
                                                style={{
                                                    marginTop:
                                                        "20px",
                                                    paddingTop:
                                                        "18px",
                                                    borderTop:
                                                        "1px solid rgba(42,35,30,0.08)",
                                                }}
                                            >
                                                <div
                                                    style={{
                                                        display:
                                                            "flex",
                                                        justifyContent:
                                                            "space-between",
                                                        alignItems:
                                                            "center",
                                                        gap:
                                                            "10px",
                                                        flexWrap:
                                                            "wrap",
                                                    }}
                                                >
                                                    <div>
                                                        <div
                                                            style={
                                                                sectionLabelStyle
                                                            }
                                                        >
                                                            Documents / Certificates
                                                        </div>

                                                        <div
                                                            style={{
                                                                marginTop:
                                                                    "4px",
                                                                color:
                                                                    "#8a827b",
                                                                fontSize:
                                                                    "11px",
                                                            }}
                                                        >
                                                            JPG, JPEG, PNG,
                                                            WEBP or PDF •
                                                            Maximum 10 MB
                                                        </div>
                                                    </div>

                                                    <span
                                                        style={
                                                            badgeStyle(
                                                                "#f1efec",
                                                                "#756d66"
                                                            )
                                                        }
                                                    >
                                                        📄{" "}
                                                        {
                                                            documents.length
                                                        }{" "}
                                                        / 10
                                                    </span>
                                                </div>

                                                {/* =============================================
                            UPLOAD NEW DOCUMENT
                        ============================================= */}

                                                <div
                                                    style={{
                                                        display:
                                                            "flex",
                                                        gap:
                                                            "8px",
                                                        alignItems:
                                                            "center",
                                                        marginTop:
                                                            "13px",
                                                        flexWrap:
                                                            "wrap",
                                                    }}
                                                >
                                                    <input
                                                        id={`document-${experienceId}`}
                                                        type="file"
                                                        accept=".jpg,.jpeg,.png,.webp,.pdf,image/jpeg,image/png,image/webp,application/pdf"
                                                        onChange={
                                                            handleDocumentSelect
                                                        }
                                                        style={{
                                                            maxWidth:
                                                                "100%",
                                                            fontSize:
                                                                "12px",
                                                        }}
                                                    />

                                                    <button
                                                        type="button"
                                                        disabled={
                                                            !selectedDocument ||
                                                            uploadingDocument ||
                                                            documents.length >=
                                                            10
                                                        }
                                                        onClick={() =>
                                                            uploadDocument(
                                                                experienceId,
                                                                selectedDocument
                                                            )
                                                        }
                                                        style={{
                                                            ...smallActionStyle,
                                                            background:
                                                                selectedDocument &&
                                                                    documents.length <
                                                                    10
                                                                    ? "#ff6f5b"
                                                                    : "#f0ece7",
                                                            color:
                                                                selectedDocument &&
                                                                    documents.length <
                                                                    10
                                                                    ? "#ffffff"
                                                                    : "#9a928b",
                                                            cursor:
                                                                selectedDocument &&
                                                                    documents.length <
                                                                    10 &&
                                                                    !uploadingDocument
                                                                    ? "pointer"
                                                                    : "not-allowed",
                                                        }}
                                                    >
                                                        {uploadingDocument
                                                            ? "Uploading..."
                                                            : "📤 Upload"}
                                                    </button>
                                                </div>

                                                {selectedDocument && (
                                                    <div
                                                        style={{
                                                            marginTop:
                                                                "8px",
                                                            fontSize:
                                                                "12px",
                                                            color:
                                                                "#756d66",
                                                            overflowWrap:
                                                                "anywhere",
                                                        }}
                                                    >
                                                        Selected:{" "}
                                                        <strong>
                                                            {
                                                                selectedDocument.name
                                                            }
                                                        </strong>
                                                    </div>
                                                )}

                                                {/* =============================================
                            DOCUMENT LIST
                        ============================================= */}

                                                {documents.length >
                                                    0 ? (
                                                    <div
                                                        style={{
                                                            display:
                                                                "grid",
                                                            gap:
                                                                "9px",
                                                            marginTop:
                                                                "14px",
                                                        }}
                                                    >
                                                        {[
                                                            ...documents,
                                                        ]
                                                            .sort(
                                                                (
                                                                    first,
                                                                    second
                                                                ) =>
                                                                    Number(
                                                                        first.displayOrder ||
                                                                        0
                                                                    ) -
                                                                    Number(
                                                                        second.displayOrder ||
                                                                        0
                                                                    )
                                                            )
                                                            .map(
                                                                (
                                                                    document,
                                                                    index
                                                                ) => {
                                                                    const documentId =
                                                                        String(
                                                                            document._id ||
                                                                            document.id
                                                                        );

                                                                    return (
                                                                        <div
                                                                            key={
                                                                                documentId
                                                                            }
                                                                            style={{
                                                                                display:
                                                                                    "flex",
                                                                                alignItems:
                                                                                    "center",
                                                                                justifyContent:
                                                                                    "space-between",
                                                                                gap:
                                                                                    "12px",
                                                                                padding:
                                                                                    "12px",
                                                                                border:
                                                                                    "1px solid rgba(42,35,30,0.08)",
                                                                                borderRadius:
                                                                                    "13px",
                                                                                background:
                                                                                    "#fffdfa",
                                                                                minWidth:
                                                                                    0,
                                                                                flexWrap:
                                                                                    "wrap",
                                                                            }}
                                                                        >
                                                                            <div
                                                                                style={{
                                                                                    display:
                                                                                        "flex",
                                                                                    alignItems:
                                                                                        "center",
                                                                                    gap:
                                                                                        "10px",
                                                                                    minWidth:
                                                                                        0,
                                                                                    flex:
                                                                                        "1 1 280px",
                                                                                }}
                                                                            >
                                                                                <div
                                                                                    style={{
                                                                                        width:
                                                                                            "40px",
                                                                                        height:
                                                                                            "40px",
                                                                                        borderRadius:
                                                                                            "11px",
                                                                                        background:
                                                                                            "#f5f1eb",
                                                                                        display:
                                                                                            "flex",
                                                                                        alignItems:
                                                                                            "center",
                                                                                        justifyContent:
                                                                                            "center",
                                                                                        flexShrink:
                                                                                            0,
                                                                                        fontSize:
                                                                                            "19px",
                                                                                    }}
                                                                                >
                                                                                    {document.mimeType ===
                                                                                        "application/pdf"
                                                                                        ? "📕"
                                                                                        : "🖼️"}
                                                                                </div>

                                                                                <div
                                                                                    style={{
                                                                                        minWidth:
                                                                                            0,
                                                                                    }}
                                                                                >
                                                                                    <div
                                                                                        style={{
                                                                                            fontSize:
                                                                                                "13px",
                                                                                            fontWeight:
                                                                                                800,
                                                                                            overflowWrap:
                                                                                                "anywhere",
                                                                                        }}
                                                                                    >
                                                                                        {
                                                                                            document.originalName
                                                                                        }
                                                                                    </div>

                                                                                    <div
                                                                                        style={{
                                                                                            marginTop:
                                                                                                "3px",
                                                                                            color:
                                                                                                "#8a827b",
                                                                                            fontSize:
                                                                                                "10px",
                                                                                        }}
                                                                                    >
                                                                                        {document.documentType ||
                                                                                            "certificate"}{" "}
                                                                                        • Order{" "}
                                                                                        {Number(
                                                                                            document.displayOrder ||
                                                                                            index
                                                                                        ) +
                                                                                            1}
                                                                                    </div>
                                                                                </div>
                                                                            </div>

                                                                            <div
                                                                                style={{
                                                                                    display:
                                                                                        "flex",
                                                                                    alignItems:
                                                                                        "center",
                                                                                    gap:
                                                                                        "6px",
                                                                                    flexWrap:
                                                                                        "wrap",
                                                                                }}
                                                                            >
                                                                                {/* VIEW */}

                                                                                <button
                                                                                    type="button"
                                                                                    disabled={
                                                                                        actionLoading ===
                                                                                        `document-${documentId}`
                                                                                    }
                                                                                    onClick={() =>
                                                                                        openSecureDocument(
                                                                                            experience,
                                                                                            document
                                                                                        )
                                                                                    }
                                                                                    style={
                                                                                        smallActionStyle
                                                                                    }
                                                                                >
                                                                                    {actionLoading ===
                                                                                        `document-${documentId}`
                                                                                        ? "Opening..."
                                                                                        : "👁️ View"}
                                                                                </button>

                                                                                {/* MOVE UP */}

                                                                                <button
                                                                                    type="button"
                                                                                    disabled={
                                                                                        index ===
                                                                                        0 ||
                                                                                        actionLoading ===
                                                                                        `reorder-${experienceId}`
                                                                                    }
                                                                                    onClick={() =>
                                                                                        moveDocument(
                                                                                            experience,
                                                                                            index,
                                                                                            -1
                                                                                        )
                                                                                    }
                                                                                    aria-label="Move document up"
                                                                                    style={{
                                                                                        ...iconActionStyle,
                                                                                        opacity:
                                                                                            index ===
                                                                                                0
                                                                                                ? 0.4
                                                                                                : 1,
                                                                                    }}
                                                                                >
                                                                                    ↑
                                                                                </button>

                                                                                {/* MOVE DOWN */}

                                                                                <button
                                                                                    type="button"
                                                                                    disabled={
                                                                                        index ===
                                                                                        documents.length -
                                                                                        1 ||
                                                                                        actionLoading ===
                                                                                        `reorder-${experienceId}`
                                                                                    }
                                                                                    onClick={() =>
                                                                                        moveDocument(
                                                                                            experience,
                                                                                            index,
                                                                                            1
                                                                                        )
                                                                                    }
                                                                                    aria-label="Move document down"
                                                                                    style={{
                                                                                        ...iconActionStyle,
                                                                                        opacity:
                                                                                            index ===
                                                                                                documents.length -
                                                                                                1
                                                                                                ? 0.4
                                                                                                : 1,
                                                                                    }}
                                                                                >
                                                                                    ↓
                                                                                </button>

                                                                                {/* REPLACE INPUT */}

                                                                                <label
                                                                                    style={
                                                                                        smallActionStyle
                                                                                    }
                                                                                >
                                                                                    🔄 Replace
                                                                                    <input
                                                                                        type="file"
                                                                                        accept=".jpg,.jpeg,.png,.webp,.pdf,image/jpeg,image/png,image/webp,application/pdf"
                                                                                        hidden
                                                                                        onChange={(
                                                                                            event
                                                                                        ) => {
                                                                                            const file =
                                                                                                event
                                                                                                    .target
                                                                                                    .files?.[0];

                                                                                            if (
                                                                                                !file
                                                                                            ) {
                                                                                                return;
                                                                                            }

                                                                                            const allowedTypes =
                                                                                                [
                                                                                                    "image/jpeg",
                                                                                                    "image/png",
                                                                                                    "image/webp",
                                                                                                    "application/pdf",
                                                                                                ];

                                                                                            if (
                                                                                                !allowedTypes.includes(
                                                                                                    file.type
                                                                                                )
                                                                                            ) {
                                                                                                showToast(
                                                                                                    "error",
                                                                                                    "📄 Only JPG, JPEG, PNG, WEBP, and PDF files are allowed."
                                                                                                );

                                                                                                event.target.value =
                                                                                                    "";

                                                                                                return;
                                                                                            }

                                                                                            if (
                                                                                                file.size >
                                                                                                10 *
                                                                                                1024 *
                                                                                                1024
                                                                                            ) {
                                                                                                showToast(
                                                                                                    "error",
                                                                                                    "📦 Replacement document must be 10 MB or smaller."
                                                                                                );

                                                                                                event.target.value =
                                                                                                    "";

                                                                                                return;
                                                                                            }

                                                                                            requestReplaceDocument(
                                                                                                experience,
                                                                                                document,
                                                                                                file
                                                                                            );

                                                                                            event.target.value =
                                                                                                "";
                                                                                        }}
                                                                                    />
                                                                                </label>

                                                                                {/* DELETE */}

                                                                                <button
                                                                                    type="button"
                                                                                    disabled={
                                                                                        deletingDocumentId ===
                                                                                        documentId
                                                                                    }
                                                                                    onClick={() =>
                                                                                        requestDeleteDocument(
                                                                                            experience,
                                                                                            document
                                                                                        )
                                                                                    }
                                                                                    style={{
                                                                                        ...smallActionStyle,
                                                                                        color:
                                                                                            "#a63d32",
                                                                                        background:
                                                                                            "#fff0ee",
                                                                                    }}
                                                                                >
                                                                                    {deletingDocumentId ===
                                                                                        documentId
                                                                                        ? "Deleting..."
                                                                                        : "🗑️"}
                                                                                </button>
                                                                            </div>

                                                                            {replacingDocument ===
                                                                                documentId && (
                                                                                    <div
                                                                                        style={{
                                                                                            width:
                                                                                                "100%",
                                                                                            fontSize:
                                                                                                "11px",
                                                                                            color:
                                                                                                "#756d66",
                                                                                            textAlign:
                                                                                                "right",
                                                                                        }}
                                                                                    >
                                                                                        Replacing
                                                                                        document...
                                                                                    </div>
                                                                                )}
                                                                        </div>
                                                                    );
                                                                }
                                                            )}
                                                    </div>
                                                ) : (
                                                    <div
                                                        style={{
                                                            marginTop:
                                                                "13px",
                                                            padding:
                                                                "16px",
                                                            border:
                                                                "1px dashed rgba(42,35,30,0.14)",
                                                            borderRadius:
                                                                "13px",
                                                            color:
                                                                "#8a827b",
                                                            fontSize:
                                                                "12px",
                                                            textAlign:
                                                                "center",
                                                        }}
                                                    >
                                                        No documents uploaded
                                                        yet.
                                                    </div>
                                                )}
                                            </div>

                                            {/* =================================================
                          QUICK CONTROLS
                      ================================================= */}

                                            <div
                                                style={{
                                                    display:
                                                        "flex",
                                                    alignItems:
                                                        "center",
                                                    gap:
                                                        "8px",
                                                    flexWrap:
                                                        "wrap",
                                                    marginTop:
                                                        "18px",
                                                    paddingTop:
                                                        "16px",
                                                    borderTop:
                                                        "1px solid rgba(42,35,30,0.08)",
                                                }}
                                            >
                                                <button
                                                    type="button"
                                                    disabled={
                                                        actionLoading ===
                                                        `${experienceId}-visibility`
                                                    }
                                                    onClick={() =>
                                                        toggleVisibility(
                                                            experience
                                                        )
                                                    }
                                                    style={
                                                        smallActionStyle
                                                    }
                                                >
                                                    {experience.isVisible
                                                        ? "🙈 Hide Public"
                                                        : "👁️ Show Public"}
                                                </button>

                                                <button
                                                    type="button"
                                                    disabled={
                                                        actionLoading ===
                                                        `${experienceId}-featured`
                                                    }
                                                    onClick={() =>
                                                        toggleFeatured(
                                                            experience
                                                        )
                                                    }
                                                    style={
                                                        smallActionStyle
                                                    }
                                                >
                                                    {experience.isFeatured
                                                        ? "☆ Unfeature"
                                                        : "⭐ Feature"}
                                                </button>

                                                <button
                                                    type="button"
                                                    disabled={
                                                        actionLoading ===
                                                        `${experienceId}-active`
                                                    }
                                                    onClick={() =>
                                                        toggleActive(
                                                            experience
                                                        )
                                                    }
                                                    style={
                                                        smallActionStyle
                                                    }
                                                >
                                                    {experience.isActive
                                                        ? "⚪ Deactivate"
                                                        : "🟢 Activate"}
                                                </button>
                                            </div>
                                        </article>
                                    );
                                }
                            )}
                        </div>
                    )}
                </div>
            </div>
        );
    };

/*
|--------------------------------------------------------------------------
| SHARED LOCAL STYLES
|--------------------------------------------------------------------------
|
| These are intentionally kept inside this JSX for now.
| We will create the dedicated CSS file after functionality
| is verified, so the page does not depend on a missing CSS file.
|
*/

const inputStyle = {
    width:
        "100%",

    minHeight:
        "44px",

    padding:
        "10px 12px",

    border:
        "1px solid rgba(42,35,30,0.11)",

    borderRadius:
        "11px",

    background:
        "#fffdfa",

    color:
        "#211e1c",

    outline:
        "none",

    boxSizing:
        "border-box",

    fontSize:
        "13px",
};

const smallActionStyle = {
    border:
        "1px solid rgba(42,35,30,0.10)",

    background:
        "#f5f1eb",

    color:
        "#4b4540",

    padding:
        "8px 11px",

    borderRadius:
        "9px",

    fontSize:
        "11px",

    fontWeight:
        800,

    cursor:
        "pointer",

    textDecoration:
        "none",

    display:
        "inline-flex",

    alignItems:
        "center",

    justifyContent:
        "center",

    gap:
        "4px",
};

const iconActionStyle = {
    border:
        "1px solid rgba(42,35,30,0.10)",

    background:
        "#f5f1eb",

    color:
        "#4b4540",

    width:
        "31px",

    height:
        "31px",

    borderRadius:
        "8px",

    fontSize:
        "14px",

    fontWeight:
        900,

    cursor:
        "pointer",
};

const detailBoxStyle = {
    background:
        "#f8f5f1",

    border:
        "1px solid rgba(42,35,30,0.06)",

    borderRadius:
        "11px",

    padding:
        "11px",

    minWidth:
        0,
};

const sectionLabelStyle = {
    fontSize:
        "11px",

    fontWeight:
        900,

    color:
        "#756d66",

    textTransform:
        "uppercase",

    letterSpacing:
        "0.07em",
};

const linkStyle = {
    display:
        "inline-flex",

    alignItems:
        "center",

    gap:
        "5px",

    padding:
        "8px 11px",

    borderRadius:
        "9px",

    background:
        "#fff5ee",

    color:
        "#9b4e36",

    textDecoration:
        "none",

    fontSize:
        "11px",

    fontWeight:
        800,
};

/*
|--------------------------------------------------------------------------
| BADGE HELPER
|--------------------------------------------------------------------------
*/

const badgeStyle = (
    background,
    color
) => ({
    display:
        "inline-flex",

    alignItems:
        "center",

    gap:
        "4px",

    padding:
        "5px 8px",

    borderRadius:
        "999px",

    background,

    color,

    fontSize:
        "10px",

    fontWeight:
        900,

    whiteSpace:
        "nowrap",
});

/*
|--------------------------------------------------------------------------
| TAG SECTION
|--------------------------------------------------------------------------
*/

const TagSection =
    ({
        title,
        icon,
        items,
    }) => {
        const safeItems =
            Array.isArray(
                items
            )
                ? items.filter(
                    Boolean
                )
                : [];

        if (
            safeItems.length ===
            0
        ) {
            return (
                <div>
                    <div
                        style={
                            sectionLabelStyle
                        }
                    >
                        {icon} {title}
                    </div>

                    <div
                        style={{
                            marginTop:
                                "8px",
                            color:
                                "#9a928b",
                            fontSize:
                                "12px",
                        }}
                    >
                        No items added.
                    </div>
                </div>
            );
        }

        return (
            <div
                style={{
                    minWidth:
                        0,
                }}
            >
                <div
                    style={
                        sectionLabelStyle
                    }
                >
                    {icon} {title}
                </div>

                <div
                    style={{
                        display:
                            "flex",
                        gap:
                            "6px",
                        flexWrap:
                            "wrap",
                        marginTop:
                            "8px",
                    }}
                >
                    {safeItems.map(
                        (
                            item,
                            index
                        ) => (
                            <span
                                key={`${title}-${item}-${index}`}
                                style={{
                                    padding:
                                        "6px 9px",
                                    borderRadius:
                                        "999px",
                                    background:
                                        "#f2eee9",
                                    color:
                                        "#5f5852",
                                    fontSize:
                                        "10px",
                                    fontWeight:
                                        800,
                                    overflowWrap:
                                        "anywhere",
                                }}
                            >
                                {item}
                            </span>
                        )
                    )}
                </div>
            </div>
        );
    };

export default AdminExperience;