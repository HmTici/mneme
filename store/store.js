import makeUniqueId from "@/lib/uniqueId";
import { create } from "zustand";

const addResources = (state, storeName, ...resources) => {
    if (!Object.values(stores).includes(storeName)) {
        throw Error(`We do not have a list called ${storeName}`);
    }
    const newStore = [...state[storeName]];
    const tagStore = [...state.tagStore];
    resources.forEach((resource) => {
        const alreadyStored = newStore.find((x) => x._id === resource._id);
        if (!alreadyStored && resource._id) {
            newStore.push(resource);
        } else if (!resource._id) {
            console.error("Missing _id property", resource);
        }
        if (resource.tags && resource.tags.length) {
            resource.tags.forEach((t) => {
                if (!tagStore.includes(t)) {
                    tagStore.push(t);
                }
            });
        }
    });
    const newState = {};
    newState[storeName] = newStore;
    newState.tagStore = tagStore;
    return newState;
};

const addTags = (state, ...tags) => {
    const tagStore = [...state.tagStore];
    tags.forEach((t) => {
        if (!tagStore.includes(t)) {
            tagStore.push(t);
        }
    });
    const newState = {};
    newState.tagStore = tagStore;
    return newState;
};

const addNotifications = (state, ...notifications) => {
    const newStore = [...state.notifications];
    notifications.forEach((n) => {
        const alreadyStored = newStore.find((x) => x._id === n._id);
        if (!alreadyStored) newStore.push(n);
    });
    const newState = {};
    newState.notifications = newStore;
    return newState;
};

const removeNotification = (state, notification) => {
    const newStore = [...state.notifications];
    const notif = newStore.find((x) => x._id === notification._id);
    const index = newStore.indexOf(notif);
    newStore.splice(index, 1);
    const newState = {};
    newState.notifications = newStore;
    return newState;
};

const updateResource = (state, storeName, newResource) => {
    if (!Object.values(stores).includes(storeName)) {
        throw Error(`We do not have a list called ${storeName}`);
    }
    if (!newResource || !newResource._id) {
        throw Error(`This resource does not have an _id key`);
    }
    const newStore = [...state[storeName]];
    const oldResource = newStore.find((x) => x._id === newResource._id);
    if (oldResource) {
        const index = newStore.indexOf(oldResource);
        newStore.splice(index, 1, newResource);
    } else {
        newStore.push(newResource);
    }
    const newState = {};
    newState[storeName] = newStore;
    return newState;
};

export const stores = {
    source: "sourceStore",
    note: "noteStore",
    quiz: "quizStore",
    course: "courseStore",
    group: "groupStore",
    user: "userStore",
};

export const useStore = create((set) => ({
    sourceStore: [],
    noteStore: [],
    quizStore: [],
    courseStore: [],
    groupStore: [],
    userStore: [],
    user: undefined,
    notifications: [],

    tagStore: [],

    setUser: (user) => {
        return set(() => ({
            user: {
                _id: user._id,
                username: user.username,
                displayName: user.displayName,
                avatar: user.avatar,
                associates: user.associates,
                groups: user.groups,
                quizzes: user.quizzes,
            },
        }));
    },

    addNotifications: (...notifications) => {
        try {
            return set((state) => addNotifications(state, ...notifications));
        } catch (error) {
            console.error(error);
        }
    },

    removeNotification: (notification) => {
        try {
            return set((state) => removeNotification(state, notification));
        } catch (error) {
            console.error(error);
        }
    },

    isAuthenticated: false,
    setIsAuthenticated: (isAuthenticated) => {
        return set(() => ({
            isAuthenticated,
        }));
    },

    addResources: (storeName, ...resources) => {
        try {
            return set((state) => addResources(state, storeName, ...resources));
        } catch (e) {
            console.error(e);
        }
    },

    updateResource: (storeName, newResource) => {
        try {
            return set((state) =>
                updateResource(state, storeName, newResource),
            );
        } catch (e) {
            console.error(e);
        }
    },

    addTags: (...tags) => {
        try {
            return set((state) => addTags(state, ...tags));
        } catch (e) {
            console.error(e);
        }
    },
}));

// Daily Train Store

export const useDailyTrain = create()((set) => ({
    start: false,
    isPaused: false,
    settings: {
        timeLimit: 60 * 15,
        tags: [],
        courses: [],
    },

    setStart: (start) => set(() => ({ start })),
    setIsPaused: (isPaused) => set(() => ({ isPaused })),
    setTimeLimit: (timeLimit) => set(() => ({ timeLimit })),
    setSettings: (newValues) =>
        set((state) => ({
            settings: {
                ...state.settings,
                ...newValues,
            },
        })),
}));

// Alerts Store

export const useAlerts = create()((set) => ({
    alerts: [],

    addAlert: (alert) =>
        set((state) => ({
            alerts: [
                ...state.alerts,
                {
                    id: makeUniqueId(),
                    ...alert,
                },
            ],
        })),

    removeAlert: (id) =>
        set((state) => ({
            alerts: state.alerts.filter((alert) => alert.id !== id),
        })),
}));

// Modals Store

export const useModals = create()((set) => ({
    modals: [],

    addModal: (modal) =>
        set((state) => ({
            modals: [
                ...state.modals,
                {
                    id: makeUniqueId(),
                    ...modal,
                },
            ],
        })),

    removeModal: (id) => {
        if (!id) {
            return set((state) => {
                let newModals = [...state.modals];
                newModals.pop();
                return {
                    modals: newModals,
                };
            });
        }

        return set((state) => ({
            modals: state.modals.filter((modal) => modal.id !== id),
        }));
    },
}));
