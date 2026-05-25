import { localService } from "../_session/local";

export function authHeader(type?: string) {
	const token = localService.get("token");
	if (token) {
		const headers: any = {
			Authorization: "Bearer " + token,
		};
		
		// Note: We generally don't set Content-Type for FormData manually 
		// to allow the browser to set the boundary.
		if (type && type !== "multipart/form-data") {
			headers["Content-Type"] = type;
		}
		
		return headers;
	}
	return {};
}