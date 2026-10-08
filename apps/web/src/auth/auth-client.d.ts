export declare const authClient: import("better-auth/react").ReactAuthClient<{
    baseURL: string;
    plugins: {
        id: "two-factor";
        version: string;
        $InferServerPlugin: ReturnType<(<O extends import("better-auth/plugins/two-factor").TwoFactorOptions>(options?: O) => {
            id: "two-factor";
            version: string;
            endpoints: {
                enableTwoFactor: import("better-call").StrictEndpoint<"/two-factor/enable", {
                    method: "POST";
                    body: import("zod").ZodObject<{
                        password: import("zod").ZodOptional<import("zod").ZodString>;
                        method: import("zod").ZodDefault<import("zod").ZodEnum<{
                            otp: "otp";
                            totp: "totp";
                        }>>;
                        issuer: import("zod").ZodOptional<import("zod").ZodString>;
                    }, import("zod/v4/core").$strip> | import("zod").ZodObject<{
                        password: import("zod").ZodString;
                        method: import("zod").ZodDefault<import("zod").ZodEnum<{
                            otp: "otp";
                            totp: "totp";
                        }>>;
                        issuer: import("zod").ZodOptional<import("zod").ZodString>;
                    }, import("zod/v4/core").$strip>;
                    use: import("better-call").Middleware<import("better-call").MiddlewareOptions, (inputContext: import("better-call").MiddlewareInputContext<import("better-call").MiddlewareOptions>) => Promise<{
                        session: {
                            session: Record<string, any> & {
                                id: string;
                                createdAt: Date;
                                updatedAt: Date;
                                userId: string;
                                expiresAt: Date;
                                token: string;
                                ipAddress?: string | null | undefined;
                                userAgent?: string | null | undefined;
                            };
                            user: Record<string, any> & {
                                id: string;
                                createdAt: Date;
                                updatedAt: Date;
                                email: string;
                                emailVerified: boolean;
                                name: string;
                                image?: string | null | undefined;
                            };
                        };
                    }>>[];
                    metadata: {
                        openapi: {
                            summary: string;
                            description: string;
                            responses: {
                                200: {
                                    description: string;
                                    content: {
                                        "application/json": {
                                            schema: {
                                                type: "object";
                                                properties: {
                                                    method: {
                                                        type: string;
                                                        enum: string[];
                                                        description: string;
                                                    };
                                                    totpURI: {
                                                        type: string;
                                                        description: string;
                                                    };
                                                    backupCodes: {
                                                        type: string;
                                                        items: {
                                                            type: string;
                                                        };
                                                        description: string;
                                                    };
                                                };
                                                required: string[];
                                            };
                                        };
                                    };
                                };
                            };
                        };
                    };
                }, {
                    method: "otp";
                } | {
                    method: "totp";
                    totpURI: string;
                    backupCodes: string[];
                }>;
                disableTwoFactor: import("better-call").StrictEndpoint<"/two-factor/disable", {
                    method: "POST";
                    body: import("zod").ZodObject<{
                        password: import("zod").ZodOptional<import("zod").ZodString>;
                    }, import("zod/v4/core").$strip> | import("zod").ZodObject<{
                        password: import("zod").ZodString;
                    }, import("zod/v4/core").$strip>;
                    use: import("better-call").Middleware<import("better-call").MiddlewareOptions, (inputContext: import("better-call").MiddlewareInputContext<import("better-call").MiddlewareOptions>) => Promise<{
                        session: {
                            session: Record<string, any> & {
                                id: string;
                                createdAt: Date;
                                updatedAt: Date;
                                userId: string;
                                expiresAt: Date;
                                token: string;
                                ipAddress?: string | null | undefined;
                                userAgent?: string | null | undefined;
                            };
                            user: Record<string, any> & {
                                id: string;
                                createdAt: Date;
                                updatedAt: Date;
                                email: string;
                                emailVerified: boolean;
                                name: string;
                                image?: string | null | undefined;
                            };
                        };
                    }>>[];
                    metadata: {
                        openapi: {
                            summary: string;
                            description: string;
                            responses: {
                                200: {
                                    description: string;
                                    content: {
                                        "application/json": {
                                            schema: {
                                                type: "object";
                                                properties: {
                                                    status: {
                                                        type: string;
                                                    };
                                                };
                                            };
                                        };
                                    };
                                };
                            };
                        };
                    };
                }, {
                    status: boolean;
                }>;
                verifyBackupCode: import("better-call").StrictEndpoint<"/two-factor/verify-backup-code", {
                    method: "POST";
                    body: import("zod").ZodObject<{
                        code: import("zod").ZodString;
                        disableSession: import("zod").ZodOptional<import("zod").ZodBoolean>;
                        trustDevice: import("zod").ZodOptional<import("zod").ZodBoolean>;
                    }, import("zod/v4/core").$strip>;
                    metadata: {
                        openapi: {
                            description: string;
                            responses: {
                                "200": {
                                    description: string;
                                    content: {
                                        "application/json": {
                                            schema: {
                                                type: "object";
                                                properties: {
                                                    user: {
                                                        type: string;
                                                        properties: {
                                                            id: {
                                                                type: string;
                                                                description: string;
                                                            };
                                                            email: {
                                                                type: string;
                                                                format: string;
                                                                nullable: boolean;
                                                                description: string;
                                                            };
                                                            emailVerified: {
                                                                type: string;
                                                                nullable: boolean;
                                                                description: string;
                                                            };
                                                            name: {
                                                                type: string;
                                                                nullable: boolean;
                                                                description: string;
                                                            };
                                                            image: {
                                                                type: string;
                                                                format: string;
                                                                nullable: boolean;
                                                                description: string;
                                                            };
                                                            twoFactorEnabled: {
                                                                type: string;
                                                                description: string;
                                                            };
                                                            createdAt: {
                                                                type: string;
                                                                format: string;
                                                                description: string;
                                                            };
                                                            updatedAt: {
                                                                type: string;
                                                                format: string;
                                                                description: string;
                                                            };
                                                        };
                                                        required: string[];
                                                        description: string;
                                                    };
                                                    session: {
                                                        type: string;
                                                        properties: {
                                                            token: {
                                                                type: string;
                                                                description: string;
                                                            };
                                                            userId: {
                                                                type: string;
                                                                description: string;
                                                            };
                                                            createdAt: {
                                                                type: string;
                                                                format: string;
                                                                description: string;
                                                            };
                                                            expiresAt: {
                                                                type: string;
                                                                format: string;
                                                                description: string;
                                                            };
                                                        };
                                                        required: string[];
                                                        description: string;
                                                    };
                                                };
                                                required: string[];
                                            };
                                        };
                                    };
                                };
                            };
                        };
                    };
                }, {
                    token: string | undefined;
                    user: (Record<string, any> & {
                        id: string;
                        createdAt: Date;
                        updatedAt: Date;
                        email: string;
                        emailVerified: boolean;
                        name: string;
                        image?: string | null | undefined;
                    }) | import("better-auth/plugins/two-factor").UserWithTwoFactor;
                }>;
                generateBackupCodes: import("better-call").StrictEndpoint<"/two-factor/generate-backup-codes", {
                    method: "POST";
                    body: import("zod").ZodObject<{
                        password: import("zod").ZodOptional<import("zod").ZodString>;
                    }, import("zod/v4/core").$strip> | import("zod").ZodObject<{
                        password: import("zod").ZodString;
                    }, import("zod/v4/core").$strip>;
                    use: import("better-call").Middleware<import("better-call").MiddlewareOptions, (inputContext: import("better-call").MiddlewareInputContext<import("better-call").MiddlewareOptions>) => Promise<{
                        session: {
                            session: Record<string, any> & {
                                id: string;
                                createdAt: Date;
                                updatedAt: Date;
                                userId: string;
                                expiresAt: Date;
                                token: string;
                                ipAddress?: string | null | undefined;
                                userAgent?: string | null | undefined;
                            };
                            user: Record<string, any> & {
                                id: string;
                                createdAt: Date;
                                updatedAt: Date;
                                email: string;
                                emailVerified: boolean;
                                name: string;
                                image?: string | null | undefined;
                            };
                        };
                    }>>[];
                    metadata: {
                        openapi: {
                            description: string;
                            responses: {
                                "200": {
                                    description: string;
                                    content: {
                                        "application/json": {
                                            schema: {
                                                type: "object";
                                                properties: {
                                                    status: {
                                                        type: string;
                                                        description: string;
                                                        enum: boolean[];
                                                    };
                                                    backupCodes: {
                                                        type: string;
                                                        items: {
                                                            type: string;
                                                        };
                                                        description: string;
                                                    };
                                                };
                                                required: string[];
                                            };
                                        };
                                    };
                                };
                            };
                        };
                    };
                }, {
                    status: boolean;
                    backupCodes: string[];
                }>;
                viewBackupCodes: import("better-call").StrictEndpoint<string, {
                    method: "POST";
                    body: import("zod").ZodObject<{
                        userId: import("zod").ZodCoercedString<unknown>;
                    }, import("zod/v4/core").$strip>;
                }, {
                    status: boolean;
                    backupCodes: string[];
                }>;
                sendTwoFactorOTP: import("better-call").StrictEndpoint<"/two-factor/send-otp", {
                    method: "POST";
                    body: import("zod").ZodOptional<import("zod").ZodObject<{
                        trustDevice: import("zod").ZodOptional<import("zod").ZodBoolean>;
                    }, import("zod/v4/core").$strip>>;
                    metadata: {
                        openapi: {
                            summary: string;
                            description: string;
                            responses: {
                                200: {
                                    description: string;
                                    content: {
                                        "application/json": {
                                            schema: {
                                                type: "object";
                                                properties: {
                                                    status: {
                                                        type: string;
                                                    };
                                                };
                                            };
                                        };
                                    };
                                };
                            };
                        };
                    };
                }, {
                    status: boolean;
                }>;
                verifyTwoFactorOTP: import("better-call").StrictEndpoint<"/two-factor/verify-otp", {
                    method: "POST";
                    body: import("zod").ZodObject<{
                        code: import("zod").ZodString;
                        trustDevice: import("zod").ZodOptional<import("zod").ZodBoolean>;
                    }, import("zod/v4/core").$strip>;
                    metadata: {
                        openapi: {
                            summary: string;
                            description: string;
                            responses: {
                                "200": {
                                    description: string;
                                    content: {
                                        "application/json": {
                                            schema: {
                                                type: "object";
                                                properties: {
                                                    token: {
                                                        type: string;
                                                        description: string;
                                                    };
                                                    user: {
                                                        type: string;
                                                        properties: {
                                                            id: {
                                                                type: string;
                                                                description: string;
                                                            };
                                                            email: {
                                                                type: string;
                                                                format: string;
                                                                nullable: boolean;
                                                                description: string;
                                                            };
                                                            emailVerified: {
                                                                type: string;
                                                                nullable: boolean;
                                                                description: string;
                                                            };
                                                            name: {
                                                                type: string;
                                                                nullable: boolean;
                                                                description: string;
                                                            };
                                                            image: {
                                                                type: string;
                                                                format: string;
                                                                nullable: boolean;
                                                                description: string;
                                                            };
                                                            createdAt: {
                                                                type: string;
                                                                format: string;
                                                                description: string;
                                                            };
                                                            updatedAt: {
                                                                type: string;
                                                                format: string;
                                                                description: string;
                                                            };
                                                        };
                                                        required: string[];
                                                        description: string;
                                                    };
                                                };
                                                required: string[];
                                            };
                                        };
                                    };
                                };
                            };
                        };
                    };
                }, {
                    token: string;
                    user: import("better-auth/plugins/two-factor").UserWithTwoFactor;
                } | {
                    token: string;
                    user: Record<string, any> & {
                        id: string;
                        createdAt: Date;
                        updatedAt: Date;
                        email: string;
                        emailVerified: boolean;
                        name: string;
                        image?: string | null | undefined;
                    };
                }>;
                generateTOTP: import("better-call").StrictEndpoint<string, {
                    method: "POST";
                    body: import("zod").ZodObject<{
                        secret: import("zod").ZodString;
                    }, import("zod/v4/core").$strip>;
                    metadata: {
                        openapi: {
                            summary: string;
                            description: string;
                            responses: {
                                200: {
                                    description: string;
                                    content: {
                                        "application/json": {
                                            schema: {
                                                type: "object";
                                                properties: {
                                                    code: {
                                                        type: string;
                                                    };
                                                };
                                            };
                                        };
                                    };
                                };
                            };
                        };
                    };
                }, {
                    code: string;
                }>;
                getTOTPURI: import("better-call").StrictEndpoint<"/two-factor/get-totp-uri", {
                    method: "POST";
                    use: import("better-call").Middleware<import("better-call").MiddlewareOptions, (inputContext: import("better-call").MiddlewareInputContext<import("better-call").MiddlewareOptions>) => Promise<{
                        session: {
                            session: Record<string, any> & {
                                id: string;
                                createdAt: Date;
                                updatedAt: Date;
                                userId: string;
                                expiresAt: Date;
                                token: string;
                                ipAddress?: string | null | undefined;
                                userAgent?: string | null | undefined;
                            };
                            user: Record<string, any> & {
                                id: string;
                                createdAt: Date;
                                updatedAt: Date;
                                email: string;
                                emailVerified: boolean;
                                name: string;
                                image?: string | null | undefined;
                            };
                        };
                    }>>[];
                    body: import("zod").ZodObject<{
                        password: import("zod").ZodOptional<import("zod").ZodString>;
                    }, import("zod/v4/core").$strip> | import("zod").ZodObject<{
                        password: import("zod").ZodString;
                    }, import("zod/v4/core").$strip>;
                    metadata: {
                        openapi: {
                            summary: string;
                            description: string;
                            responses: {
                                200: {
                                    description: string;
                                    content: {
                                        "application/json": {
                                            schema: {
                                                type: "object";
                                                properties: {
                                                    totpURI: {
                                                        type: string;
                                                    };
                                                };
                                            };
                                        };
                                    };
                                };
                            };
                        };
                    };
                }, {
                    totpURI: string;
                }>;
                verifyTOTP: import("better-call").StrictEndpoint<"/two-factor/verify-totp", {
                    method: "POST";
                    body: import("zod").ZodObject<{
                        code: import("zod").ZodString;
                        trustDevice: import("zod").ZodOptional<import("zod").ZodBoolean>;
                    }, import("zod/v4/core").$strip>;
                    metadata: {
                        openapi: {
                            summary: string;
                            description: string;
                            responses: {
                                200: {
                                    description: string;
                                    content: {
                                        "application/json": {
                                            schema: {
                                                type: "object";
                                                properties: {
                                                    status: {
                                                        type: string;
                                                    };
                                                };
                                            };
                                        };
                                    };
                                };
                            };
                        };
                    };
                }, {
                    token: string;
                    user: import("better-auth/plugins/two-factor").UserWithTwoFactor;
                } | {
                    token: string;
                    user: Record<string, any> & {
                        id: string;
                        createdAt: Date;
                        updatedAt: Date;
                        email: string;
                        emailVerified: boolean;
                        name: string;
                        image?: string | null | undefined;
                    };
                }>;
            };
            options: NoInfer<O>;
            hooks: {
                after: {
                    matcher(context: import("better-auth").HookEndpointContext): boolean;
                    handler: import("better-call").Middleware<import("better-call").MiddlewareOptions, (inputContext: import("better-call").MiddlewareInputContext<import("better-call").MiddlewareOptions>) => Promise<{
                        twoFactorRedirect: boolean;
                        twoFactorMethods: string[];
                    } | undefined>>;
                }[];
            };
            schema: {
                user: {
                    fields: {
                        twoFactorEnabled: {
                            type: "boolean";
                            required: false;
                            defaultValue: false;
                            input: false;
                        };
                    };
                };
                twoFactor: {
                    fields: {
                        secret: {
                            type: "string";
                            required: true;
                            returned: false;
                            index: true;
                        };
                        backupCodes: {
                            type: "string";
                            required: true;
                            returned: false;
                        };
                        userId: {
                            type: "string";
                            required: true;
                            returned: false;
                            references: {
                                model: string;
                                field: string;
                            };
                            index: true;
                        };
                        verified: {
                            type: "boolean";
                            required: false;
                            defaultValue: true;
                            input: false;
                        };
                        failedVerificationCount: {
                            type: "number";
                            required: false;
                            defaultValue: number;
                            input: false;
                            returned: false;
                        };
                        lockedUntil: {
                            type: "date";
                            required: false;
                            input: false;
                            returned: false;
                        };
                    };
                };
            };
            rateLimit: {
                pathMatcher(path: string): boolean;
                window: number;
                max: number;
            }[];
            $ERROR_CODES: {
                OTP_NOT_ENABLED: import("better-auth").RawError<"OTP_NOT_ENABLED">;
                OTP_NOT_CONFIGURED: import("better-auth").RawError<"OTP_NOT_CONFIGURED">;
                OTP_HAS_EXPIRED: import("better-auth").RawError<"OTP_HAS_EXPIRED">;
                TOTP_NOT_ENABLED: import("better-auth").RawError<"TOTP_NOT_ENABLED">;
                TOTP_ALREADY_ENABLED: import("better-auth").RawError<"TOTP_ALREADY_ENABLED">;
                TOTP_NOT_CONFIGURED: import("better-auth").RawError<"TOTP_NOT_CONFIGURED">;
                TWO_FACTOR_NOT_ENABLED: import("better-auth").RawError<"TWO_FACTOR_NOT_ENABLED">;
                BACKUP_CODES_NOT_ENABLED: import("better-auth").RawError<"BACKUP_CODES_NOT_ENABLED">;
                INVALID_BACKUP_CODE: import("better-auth").RawError<"INVALID_BACKUP_CODE">;
                INVALID_CODE: import("better-auth").RawError<"INVALID_CODE">;
                TOO_MANY_ATTEMPTS_REQUEST_NEW_CODE: import("better-auth").RawError<"TOO_MANY_ATTEMPTS_REQUEST_NEW_CODE">;
                ACCOUNT_TEMPORARILY_LOCKED: import("better-auth").RawError<"ACCOUNT_TEMPORARILY_LOCKED">;
                INVALID_TWO_FACTOR_COOKIE: import("better-auth").RawError<"INVALID_TWO_FACTOR_COOKIE">;
            };
        })>;
        atomListeners: {
            matcher: (path: string) => boolean;
            signal: "$sessionSignal";
        }[];
        pathMethods: {
            "/two-factor/disable": "POST";
            "/two-factor/enable": "POST";
            "/two-factor/send-otp": "POST";
            "/two-factor/generate-backup-codes": "POST";
            "/two-factor/get-totp-uri": "POST";
            "/two-factor/verify-totp": "POST";
            "/two-factor/verify-otp": "POST";
            "/two-factor/verify-backup-code": "POST";
        };
        fetchPlugins: {
            id: string;
            name: string;
            hooks: {
                onSuccess(context: import("@better-fetch/fetch").SuccessContext<any>): Promise<void>;
            };
        }[];
        $ERROR_CODES: {
            OTP_NOT_ENABLED: import("better-auth").RawError<"OTP_NOT_ENABLED">;
            OTP_NOT_CONFIGURED: import("better-auth").RawError<"OTP_NOT_CONFIGURED">;
            OTP_HAS_EXPIRED: import("better-auth").RawError<"OTP_HAS_EXPIRED">;
            TOTP_NOT_ENABLED: import("better-auth").RawError<"TOTP_NOT_ENABLED">;
            TOTP_ALREADY_ENABLED: import("better-auth").RawError<"TOTP_ALREADY_ENABLED">;
            TOTP_NOT_CONFIGURED: import("better-auth").RawError<"TOTP_NOT_CONFIGURED">;
            TWO_FACTOR_NOT_ENABLED: import("better-auth").RawError<"TWO_FACTOR_NOT_ENABLED">;
            BACKUP_CODES_NOT_ENABLED: import("better-auth").RawError<"BACKUP_CODES_NOT_ENABLED">;
            INVALID_BACKUP_CODE: import("better-auth").RawError<"INVALID_BACKUP_CODE">;
            INVALID_CODE: import("better-auth").RawError<"INVALID_CODE">;
            TOO_MANY_ATTEMPTS_REQUEST_NEW_CODE: import("better-auth").RawError<"TOO_MANY_ATTEMPTS_REQUEST_NEW_CODE">;
            ACCOUNT_TEMPORARILY_LOCKED: import("better-auth").RawError<"ACCOUNT_TEMPORARILY_LOCKED">;
            INVALID_TWO_FACTOR_COOKIE: import("better-auth").RawError<"INVALID_TWO_FACTOR_COOKIE">;
        };
    }[];
}>;
export declare const signIn: typeof authClient.signIn;
export declare const signUp: typeof authClient.signUp;
export declare const signOut: typeof authClient.signOut;
export declare const useSession: typeof authClient.useSession;
export declare const twoFactor: {
    enable: <FetchOptions extends import("better-auth").ClientFetchOption<Partial<{
        password?: string | undefined;
        method?: "otp" | "totp" | undefined;
        issuer?: string | undefined;
    } | {
        password: string;
        method?: "otp" | "totp" | undefined;
        issuer?: string | undefined;
    }> & Record<string, any>, Partial<Record<string, any>> & Record<string, any>, Record<string, string | undefined> | undefined>>(data_0: import("better-auth").Prettify<{
        password?: string | undefined;
        method?: "otp" | "totp" | undefined;
        issuer?: string | undefined;
    } & {
        fetchOptions?: FetchOptions | undefined;
    }> | import("better-auth").Prettify<{
        password: string;
        method?: "otp" | "totp" | undefined;
        issuer?: string | undefined;
    } & {
        fetchOptions?: FetchOptions | undefined;
    }>, data_1?: FetchOptions | undefined) => Promise<import("@better-fetch/fetch").BetterFetchResponse<NonNullable<{
        method: "otp";
    } | {
        method: "totp";
        totpURI: string;
        backupCodes: string[];
    }>, {
        code?: string | undefined;
        message?: string | undefined;
    }, FetchOptions["throw"] extends true ? true : false>>;
} & {
    disable: <FetchOptions extends import("better-auth").ClientFetchOption<Partial<{
        password?: string | undefined;
    } | {
        password: string;
    }> & Record<string, any>, Partial<Record<string, any>> & Record<string, any>, Record<string, string | undefined> | undefined>>(data_0: import("better-auth").Prettify<{
        password?: string | undefined;
    } & {
        fetchOptions?: FetchOptions | undefined;
    }> | import("better-auth").Prettify<{
        password: string;
    } & {
        fetchOptions?: FetchOptions | undefined;
    }>, data_1?: FetchOptions | undefined) => Promise<import("@better-fetch/fetch").BetterFetchResponse<{
        status: boolean;
    }, {
        code?: string | undefined;
        message?: string | undefined;
    }, FetchOptions["throw"] extends true ? true : false>>;
} & {
    verifyBackupCode: <FetchOptions extends import("better-auth").ClientFetchOption<Partial<{
        code: string;
        disableSession?: boolean | undefined;
        trustDevice?: boolean | undefined;
    }> & Record<string, any>, Partial<Record<string, any>> & Record<string, any>, Record<string, string | undefined> | undefined>>(data_0: import("better-auth").Prettify<{
        code: string;
        disableSession?: boolean | undefined;
        trustDevice?: boolean | undefined;
    } & {
        fetchOptions?: FetchOptions | undefined;
    }>, data_1?: FetchOptions | undefined) => Promise<import("@better-fetch/fetch").BetterFetchResponse<Omit<{
        token: string | undefined;
        user: (Record<string, any> & {
            id: string;
            createdAt: Date;
            updatedAt: Date;
            email: string;
            emailVerified: boolean;
            name: string;
            image?: string | null | undefined;
        }) | import("better-auth/plugins/two-factor").UserWithTwoFactor;
    }, "user"> & {
        user: import("better-auth").StripEmptyObjects<{
            id: string;
            createdAt: Date;
            updatedAt: Date;
            email: string;
            emailVerified: boolean;
            name: string;
            image?: string | null | undefined;
        } & {
            twoFactorEnabled: boolean | null | undefined;
        } & {}>;
    }, {
        code?: string | undefined;
        message?: string | undefined;
    }, FetchOptions["throw"] extends true ? true : false>>;
} & {
    generateBackupCodes: <FetchOptions extends import("better-auth").ClientFetchOption<Partial<{
        password?: string | undefined;
    } | {
        password: string;
    }> & Record<string, any>, Partial<Record<string, any>> & Record<string, any>, Record<string, string | undefined> | undefined>>(data_0: import("better-auth").Prettify<{
        password?: string | undefined;
    } & {
        fetchOptions?: FetchOptions | undefined;
    }> | import("better-auth").Prettify<{
        password: string;
    } & {
        fetchOptions?: FetchOptions | undefined;
    }>, data_1?: FetchOptions | undefined) => Promise<import("@better-fetch/fetch").BetterFetchResponse<{
        status: boolean;
        backupCodes: string[];
    }, {
        code?: string | undefined;
        message?: string | undefined;
    }, FetchOptions["throw"] extends true ? true : false>>;
} & {
    sendOtp: <FetchOptions extends import("better-auth").ClientFetchOption<Partial<{
        trustDevice?: boolean | undefined;
    }> & Record<string, any>, Partial<Record<string, any>> & Record<string, any>, Record<string, string | undefined> | undefined>>(data_0?: import("better-auth").Prettify<{
        trustDevice?: boolean | undefined;
    } & {
        fetchOptions?: FetchOptions | undefined;
    }> | undefined, data_1?: FetchOptions | undefined) => Promise<import("@better-fetch/fetch").BetterFetchResponse<{
        status: boolean;
    }, {
        code?: string | undefined;
        message?: string | undefined;
    }, FetchOptions["throw"] extends true ? true : false>>;
} & {
    verifyOtp: <FetchOptions extends import("better-auth").ClientFetchOption<Partial<{
        code: string;
        trustDevice?: boolean | undefined;
    }> & Record<string, any>, Partial<Record<string, any>> & Record<string, any>, Record<string, string | undefined> | undefined>>(data_0: import("better-auth").Prettify<{
        code: string;
        trustDevice?: boolean | undefined;
    } & {
        fetchOptions?: FetchOptions | undefined;
    }>, data_1?: FetchOptions | undefined) => Promise<import("@better-fetch/fetch").BetterFetchResponse<(Omit<{
        token: string;
        user: import("better-auth/plugins/two-factor").UserWithTwoFactor;
    }, "user"> & {
        user: import("better-auth").StripEmptyObjects<{
            id: string;
            createdAt: Date;
            updatedAt: Date;
            email: string;
            emailVerified: boolean;
            name: string;
            image?: string | null | undefined;
        } & {
            twoFactorEnabled: boolean | null | undefined;
        } & {}>;
    }) | (Omit<{
        token: string;
        user: Record<string, any> & {
            id: string;
            createdAt: Date;
            updatedAt: Date;
            email: string;
            emailVerified: boolean;
            name: string;
            image?: string | null | undefined;
        };
    }, "user"> & {
        user: import("better-auth").StripEmptyObjects<{
            id: string;
            createdAt: Date;
            updatedAt: Date;
            email: string;
            emailVerified: boolean;
            name: string;
            image?: string | null | undefined;
        } & {
            twoFactorEnabled: boolean | null | undefined;
        } & {}>;
    }), {
        code?: string | undefined;
        message?: string | undefined;
    }, FetchOptions["throw"] extends true ? true : false>>;
} & {
    getTotpUri: <FetchOptions extends import("better-auth").ClientFetchOption<Partial<{
        password?: string | undefined;
    } | {
        password: string;
    }> & Record<string, any>, Partial<Record<string, any>> & Record<string, any>, Record<string, string | undefined> | undefined>>(data_0: import("better-auth").Prettify<{
        password?: string | undefined;
    } & {
        fetchOptions?: FetchOptions | undefined;
    }> | import("better-auth").Prettify<{
        password: string;
    } & {
        fetchOptions?: FetchOptions | undefined;
    }>, data_1?: FetchOptions | undefined) => Promise<import("@better-fetch/fetch").BetterFetchResponse<{
        totpURI: string;
    }, {
        code?: string | undefined;
        message?: string | undefined;
    }, FetchOptions["throw"] extends true ? true : false>>;
} & {
    verifyTotp: <FetchOptions extends import("better-auth").ClientFetchOption<Partial<{
        code: string;
        trustDevice?: boolean | undefined;
    }> & Record<string, any>, Partial<Record<string, any>> & Record<string, any>, Record<string, string | undefined> | undefined>>(data_0: import("better-auth").Prettify<{
        code: string;
        trustDevice?: boolean | undefined;
    } & {
        fetchOptions?: FetchOptions | undefined;
    }>, data_1?: FetchOptions | undefined) => Promise<import("@better-fetch/fetch").BetterFetchResponse<(Omit<{
        token: string;
        user: import("better-auth/plugins/two-factor").UserWithTwoFactor;
    }, "user"> & {
        user: import("better-auth").StripEmptyObjects<{
            id: string;
            createdAt: Date;
            updatedAt: Date;
            email: string;
            emailVerified: boolean;
            name: string;
            image?: string | null | undefined;
        } & {
            twoFactorEnabled: boolean | null | undefined;
        } & {}>;
    }) | (Omit<{
        token: string;
        user: Record<string, any> & {
            id: string;
            createdAt: Date;
            updatedAt: Date;
            email: string;
            emailVerified: boolean;
            name: string;
            image?: string | null | undefined;
        };
    }, "user"> & {
        user: import("better-auth").StripEmptyObjects<{
            id: string;
            createdAt: Date;
            updatedAt: Date;
            email: string;
            emailVerified: boolean;
            name: string;
            image?: string | null | undefined;
        } & {
            twoFactorEnabled: boolean | null | undefined;
        } & {}>;
    }), {
        code?: string | undefined;
        message?: string | undefined;
    }, FetchOptions["throw"] extends true ? true : false>>;
};
