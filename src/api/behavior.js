import axios from "axios";

export class BehaviorService {
  constructor() {
    this.baseUrl = import.meta.env.VITE_APP_BASE_URL;
    this.token = localStorage.getItem("token");
  }

  // Behaviortype
  async createBehaviortype(data) {
    try {
      const params = new URLSearchParams();
      params.append("name", data.name);

      let config = {
        method: "post",
        maxBodyLength: Infinity,
        url: `${this.baseUrl}behaviortype`,
        headers: {
          "Content-Type": "application/x-www-form-urlencoded",
          Authorization: `Bearer ${this.token}`,
        },
        data: params,
      };
      const response = await axios.request(config);
      return response.data;
    } catch (error) {
      console.error("Create behaviortype error:", error);
      throw error;
    }
  }

  async getBehaviortypes() {
    try {
      let config = {
        method: "get",
        maxBodyLength: Infinity,
        url: `${this.baseUrl}behaviortype`,
        headers: {
          Authorization: `Bearer ${this.token}`,
        },
      };
      const response = await axios.request(config);
      return response.data;
    } catch (error) {
      console.error("Get behaviortypes error:", error);
      throw error;
    }
  }

  async updateBehaviortype(id, data) {
    try {
      const params = new URLSearchParams();
      params.append("name", data.name);

      let config = {
        method: "put",
        maxBodyLength: Infinity,
        url: `${this.baseUrl}behaviortype/${id}`,
        headers: {
          "Content-Type": "application/x-www-form-urlencoded",
          Authorization: `Bearer ${this.token}`,
        },
        data: params,
      };
      const response = await axios.request(config);
      return response.data;
    } catch (error) {
      console.error("Update behaviortype error:", error);
      throw error;
    }
  }

  async deleteBehaviortype(id) {
    try {
      const token = this.token;
      const myHeaders = new Headers();
      myHeaders.append("Authorization", `Bearer ${token}`);

      const urlencoded = new URLSearchParams();

      const requestOptions = {
        method: "DELETE",
        headers: myHeaders,
        body: urlencoded,
        redirect: "follow",
      };

      const url = `${this.baseUrl}behaviortype/${id}`;
      const response = await fetch(url, requestOptions);
      const result = await response.text();
      return result;
    } catch (error) {
      console.error("Delete behaviortype error:", error);
      throw error;
    }
  }

  // Behavior
  async createBehavior(data) {
    try {
      const payload = { ...data };
      let config = {
        method: "post",
        maxBodyLength: Infinity,
        url: `${this.baseUrl}behavior`,
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${this.token}`,
        },
        data: JSON.stringify(payload),
      };
      const response = await axios.request(config);
      return response.data;
    } catch (error) {
      console.error("Create behavior error:", error);
      throw error;
    }
  }

  async getBehaviorsByType(behaviortypeId) {
    try {
      let config = {
        method: "get",
        maxBodyLength: Infinity,
        url: `${this.baseUrl}behavior/behaviortype/${behaviortypeId}`,
        headers: {
          Authorization: `Bearer ${this.token}`,
        },
      };
      const response = await axios.request(config);
      return response.data;
    } catch (error) {
      console.error("Get behaviors by type error:", error);
      throw error;
    }
  }

  async updateBehavior(id, data) {
    try {
      const params = new URLSearchParams();
      params.append("name", data.name);

      let config = {
        method: "patch",
        maxBodyLength: Infinity,
        url: `${this.baseUrl}behavior/${id}`,
        headers: {
          "Content-Type": "application/x-www-form-urlencoded",
          Authorization: `Bearer ${this.token}`,
        },
        data: params,
      };
      const response = await axios.request(config);
      return response.data;
    } catch (error) {
      console.error("Update behavior error:", error);
      throw error;
    }
  }

  async deleteBehavior(id) {
    try {
      const token = this.token;
      const myHeaders = new Headers();
      myHeaders.append("Authorization", `Bearer ${token}`);

      const requestOptions = {
        method: "DELETE",
        headers: myHeaders,
        redirect: "follow",
      };

      const url = `${this.baseUrl}behavior/${id}`;
      const response = await fetch(url, requestOptions);
      const result = await response.text();
      return result;
    } catch (error) {
      console.error("Delete behavior error:", error);
      throw error;
    }
  }

  // BehaviorLevel
  async createBehaviorLevel(data) {
    try {
      const params = new URLSearchParams();
      params.append("name", data.name);
      params.append("score", data.score);
      params.append("level", data.level);
      params.append("behavior_id", data.behavior_id);

      let config = {
        method: "post",
        maxBodyLength: Infinity,
        url: `${this.baseUrl}behaviorlevel`,
        headers: {
          "Content-Type": "application/x-www-form-urlencoded",
          Authorization: `Bearer ${this.token}`,
        },
        data: params,
      };
      const response = await axios.request(config);
      return response.data;
    } catch (error) {
      console.error("Create behaviorlevel error:", error);
      throw error;
    }
  }

  async getBehaviorLevelsByBehaviorId(behaviorId) {
    try {
      let config = {
        method: "get",
        maxBodyLength: Infinity,
        url: `${this.baseUrl}behaviorlevel/behavior/${behaviorId}`,
        headers: {
          Authorization: `Bearer ${this.token}`,
        },
      };
      const response = await axios.request(config);
      return response.data;
    } catch (error) {
      console.error("Get behaviorlevels by behaviorId error:", error);
      throw error;
    }
  }

  async getBehaviorLevelById(id) {
    try {
      let config = {
        method: "get",
        maxBodyLength: Infinity,
        url: `${this.baseUrl}behaviorlevel/id/${id}`,
        headers: {
          Authorization: `Bearer ${this.token}`,
        },
      };
      const response = await axios.request(config);
      return response.data;
    } catch (error) {
      console.error("Get behaviorlevel by id error:", error);
      throw error;
    }
  }

  async updateBehaviorLevel(id, data) {
    try {
      const params = new URLSearchParams();
      params.append("name", data.name);
      params.append("level", data.level);
      params.append("score", data.score);

      let config = {
        method: "patch",
        maxBodyLength: Infinity,
        url: `${this.baseUrl}behaviorlevel/${id}`,
        headers: {
          "Content-Type": "application/x-www-form-urlencoded",
          Authorization: `Bearer ${this.token}`,
        },
        data: params,
      };
      const response = await axios.request(config);
      return response.data;
    } catch (error) {
      console.error("Update behaviorlevel error:", error);
      throw error;
    }
  }

  async deleteBehaviorLevel(id) {
    try {
      const url = `${this.baseUrl}behaviorlevel/${id}`;
      const config = {
        method: "delete",
        url,
        headers: {
          Authorization: `Bearer ${this.token}`,
        },
      };
      const response = await axios(config);
      return response.data;
    } catch (error) {
      console.error("Delete behaviorlevel error:", error);
      throw error;
    }
  }

  // AttendanceConductSetting
  async updateAttendanceConductSetting(data) {
    try {
      let config = {
        method: "put",
        maxBodyLength: Infinity,
        url: `${this.baseUrl}attendance-conduct-setting`,
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${this.token}`,
        },
        data: JSON.stringify(data),
      };
      const response = await axios.request(config);
      return response.data;
    } catch (error) {
      console.error("Update attendance conduct setting error:", error);
      throw error;
    }
  }

  async getAttendanceConductSetting() {
    try {
      let config = {
        method: "get",
        maxBodyLength: Infinity,
        url: `${this.baseUrl}attendance-conduct-setting`,
        headers: {
          Authorization: `Bearer ${this.token}`,
        },
      };
      const response = await axios.request(config);
      return response.data;
    } catch (error) {
      console.error("Get attendance conduct setting error:", error);
      throw error;
    }
  }
}
