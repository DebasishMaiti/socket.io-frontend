import axios from "axios";
import { authHeader } from "../_helper/auth-header";

// export const baseUrl = "https://socket-io-backend-z0wz.onrender.com";
export const baseUrl = "http://localhost:5000";
export const rootUrl = `${baseUrl}/api`;

const authUrl = rootUrl + '/auth';
const messageUrl = rootUrl + '/messages';
const userUrl = rootUrl + '/users';

// ========== auth ==========

async function login(data: any) {
    return await axios.post(authUrl + '/login', data);
}

async function signup(data: any) {
    return await axios.post(authUrl + '/register', data);
}

async function logout() {
    return await axios.post(authUrl + '/logout', {}, {
        headers: authHeader(""),
    });
}

async function getProfile() {
    return await axios.get(userUrl + '/profile', {
        headers: authHeader(""),
    });
};

// ========== chat ==========

async function getConversations() {
    return await axios.get(messageUrl + '/conversations', {
        headers: authHeader(""),
    });
};

async function getMessages(id: string) {
    return await axios.get(messageUrl + `/${id}`, {
        headers: authHeader(""),
    });
};

async function sendMessage(id: string, content: string) {
    return await axios.post(messageUrl + `/send/${id}`, { content }, {
        headers: authHeader(""),
    });
};

async function sendVoiceMessage(id: string, formData: FormData) {
    return await axios.post(messageUrl + `/send-voice/${id}`, formData, {
        headers: authHeader(),
    });
};

async function sendMediaMessage(id: string, formData: FormData) {
    return await axios.post(messageUrl + `/send-media/${id}`, formData, {
        headers: authHeader(),
    });
};

async function createGroup(data: any) {
    return await axios.post(messageUrl + "/create-group", data, {
        headers: authHeader(""),
    });
};

async function markSeen(id: string) {
    return await axios.post(messageUrl + `/seen/${id}`, {}, {
        headers: authHeader(""),
    });
};

async function deleteMessageForMe(id: string) {
    return await axios.post(messageUrl + `/delete-me/${id}`, {}, {
        headers: authHeader(""),
    });
};

async function deleteMessageForEveryone(id: string) {
    return await axios.post(messageUrl + `/delete-everyone/${id}`, {}, {
        headers: authHeader(""),
    });
};

async function getUsers() {
    return await axios.get(userUrl + "/", {
        headers: authHeader(""),
    });
};

async function leaveGroup(id: string) {
    return await axios.post(messageUrl + `/leave/${id}`, {}, {
        headers: authHeader(""),
    });
};

async function kickMember(id: string, userId: string) {
    return await axios.post(messageUrl + `/kick/${id}`, { userId }, {
        headers: authHeader(""),
    });
};

async function promoteAdmin(id: string, userId: string) {
    return await axios.post(messageUrl + `/promote/${id}`, { userId }, {
        headers: authHeader(""),
    });
};

async function demoteAdmin(id: string, userId: string) {
    return await axios.post(messageUrl + `/demote/${id}`, { userId }, {
        headers: authHeader(""),
    });
};

async function updateGroupProfile(id: string, formData: FormData) {
    return await axios.post(messageUrl + `/update-group-image/${id}`, formData, {
        headers: authHeader(),
    });
};

async function addMembers(id: string, participants: string[]) {
    return await axios.post(messageUrl + `/add-members/${id}`, { participants }, {
        headers: authHeader(""),
    });
};

async function updateProfile(formData: FormData) {
    return await axios.post(userUrl + "/update", formData, {
        headers: authHeader(),
    });
};

async function getUserProfile(id: string) {
    return await axios.get(userUrl + `/profile/${id}`, {
        headers: authHeader(""),
    });
};

export const service = {
    login, signup, logout, getProfile,
    getConversations, getMessages, sendMessage, sendVoiceMessage, sendMediaMessage, createGroup, markSeen, getUsers,
    deleteMessageForMe, deleteMessageForEveryone, updateProfile,
    leaveGroup, kickMember, promoteAdmin, demoteAdmin, updateGroupProfile, addMembers, getUserProfile
};
