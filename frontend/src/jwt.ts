import Cookies from "js-cookie";

class Jwt {
  private static readonly TOKEN_KEY = "octank_token";
  private static readonly EXPIRES_MS = 1000 * 60 * 60;
  private _token: string | null = null;
  payload: any | null;

  get username(): string | null {
    this.ensurePayload();
    return this.payload?.username ?? null;
  }

  get token(): string | null {
    if (!this._token) {
      this._token = Cookies.get(Jwt.TOKEN_KEY) || null;
    }
    return this._token;
  }

  set token(value: string | null) {
    if (value) {
      this._token = value;
      this.payload = this.parseJwt(value);
      Cookies.set(Jwt.TOKEN_KEY, value, {
        expires: new Date(new Date().getTime() + Jwt.EXPIRES_MS),
      });
    }
  }

  private ensurePayload() {
    if (!this.payload) {
      this.payload = this.parseJwt(this.token);
    }
  }

  parseJwt(token: string | null): any {
    if (!token) {
      return {};
    }
    try {
      return JSON.parse(atob(token.split(".")[1]));
    } catch (e) {
      console.warn(e);
      return {};
    }
  }

  clear() {
    Cookies.remove(Jwt.TOKEN_KEY);
    this.payload = {};
    this._token = null;
  }
}

export default new Jwt();
