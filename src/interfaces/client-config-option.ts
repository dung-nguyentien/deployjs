export interface ClientConfigOption {
    default?: {
        asUser: string,
        deleteOnRollback: boolean,
        deployTo: string,
        keepReleases: number,
        repositoryUrl: string,
        shallowClone: boolean,
        workspace: string,
        releasePath: string
    }
}
