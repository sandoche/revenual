export interface Provider {
    slug: string;
    name: string;
}

export interface Linkable {
    url: string;
}

export interface Authenticable {
    getToken(data: object): Promise<string>;
    template: string;
}

export interface LinkableProvider extends Provider, Linkable {}

export interface AuthenticableProvider extends Provider, Authenticable {}