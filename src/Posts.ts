export enum PostType {
    Opinion = 'opinions',
    Tutorial = 'tutorials',
}

export interface PostMeta {
    humanTitle: string;
    urlTitle: string;
    type: PostType;
}

export interface Post extends PostMeta {
    text: string;
}

const postMetas: Array<PostMeta> = [
    {
        humanTitle: 'Kubernetes client-go: Updating and rolling back a deployment',
        urlTitle: 'kubernetes-go-creating-updating-rolling-back.md',
        type: PostType.Tutorial,
    },
    {
        humanTitle: 'Building a webapp for pod logs: gRPC with Typescript and Go',
        urlTitle: 'grpc-with-typescript-and-go.md',
        type: PostType.Tutorial,
    },
    {
        humanTitle: 'A year of DevOps: Musings from a software developer',
        urlTitle: 'what-i-learned-from-a-year-of-devops.md',
        type: PostType.Opinion,
    }
];

export function loadPostMeta(): Array<PostMeta> {
    return postMetas.slice();
}

export function loadPostFromLocation(location: string): Promise<Post> {
    return new Promise((resolve, reject) => {
        let postType = Object.values(PostType).find((p: string) => location.indexOf(p) > 0);
        if (!postType) {
            return reject(`Cant find a PostType (${Object.values(PostType)}) in ${location}`);
        }

        let urlTitle = location.split(postType + '/').pop();
        let postMeta = loadPostMeta().find((p: PostMeta) => p.urlTitle === urlTitle);
        if (postMeta === undefined) {
            return reject('Post not found');
        }

        fetch(`/raw/${postType}/${postMeta!!.urlTitle}`)
            .then((res) => res.text())
            .then((text: string) => {
                return resolve({...postMeta, text: text} as Post);
            })
            .catch((reason) => reject(reason));
    });
}
