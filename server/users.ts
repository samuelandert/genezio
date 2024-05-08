// server/user.ts
import { UserModel } from "./models/userModel"
import { GenezioAuth, GenezioDeploy, GnzContext } from "@genezio/types";

import { DataTypes, Sequelize } from "sequelize";
import pg from "pg";

export type User = {
    userId: number;
    name: string;
    address: string;
};

// The type that will be returned in some of our CRUD Functions
export type UserResponse = {
    success: boolean;
    msg?: string;
    user?: User;
    err?: string;
};

// The type that will be used to return all the users from the databse
export type AllUsersResponse = {
    success: boolean;
    msg?: string;
    users?: Array<User>;
    err?: string;
};

/**
 * The User server class that will be deployed on the genezio infrastructure.
 */
@GenezioDeploy()
export class UserService {
    constructor() {
        this.#connect();
    }
    /**
     * Private method used to connect to the DB.
     */
    #connect() {
        try {
            // Check if you have a NEON_POSTGRES_URL variable

            if (!process.env.NEON_POSTGRES_URL) {
                console.log(
                    "\x1b[31m%s\x1b[0m",
                    "ERROR: Your NEON_POSTGRES_URL environment variable is not set, go to https://genezio.com/docs/integrations/neon-postgres to learn how to integrate your project with Neon Postgres"
                );
                return;
            }

            // Initialize the database connection manager
            const sequelize = new Sequelize(process.env.NEON_POSTGRES_URL || "", {
                dialect: "postgres", // or your database type
                dialectModule: pg,
                define: {
                    timestamps: false, // This disables the created_at and updated_at columns
                },
                dialectOptions: {
                    ssl: {
                        require: true, // Use SSL with the 'require' option
                    },
                },
            });

            // Intialize the UserModel
            UserModel.init(
                {
                    userId: {
                        type: DataTypes.INTEGER,
                        primaryKey: true,
                    },
                    name: DataTypes.STRING(512),
                    address: DataTypes.STRING(512),
                },
                {
                    sequelize,
                    modelName: "User",
                    tableName: "users",
                }
            );

            sequelize.sync();
        } catch (err) {
            console.log(
                "\x1b[33m%s\x1b[0m",
                "WARNING: Check if your environment variables are correctly set"
            );
            console.log(err);
        }
    }

    @GenezioAuth()
    async updateUser(context: GnzContext, newName: string): Promise<UserResponse> {
        const userAddress = context.user?.address;
        if (!userAddress) {
            return {
                success: false,
                err: "User not authenticated or token has expired",
            };
        }

        console.log(`Update request received for user at address ${userAddress} to update name to ${newName}`);

        const user = await UserModel.findOne({
            where: { address: userAddress },
        });

        if (!user) {
            return {
                success: false,
                err: "User does not exist or the user doesn't have access to it",
            };
        }

        try {
            user.set({
                name: newName,
            });
            await user.save();
        } catch (error: any) {
            return { success: false, err: error.toString() };
        }

        return { success: true, user: user };
    }

    async getUsers(): Promise<AllUsersResponse> {
        const users = await UserModel.findAll();
        if (users) {
            return { success: true, msg: "Users retrived succesfully", users: users };
        }
        return { success: false, msg: "Error at database" };
    }
}