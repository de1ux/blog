import 'whatwg-fetch';

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
        urlTitle: 'kubernetes-go-creating-updating-rolling-back',
        type: PostType.Tutorial,
    },
    {
        humanTitle: 'Part 1 - Building a webapp for pod logs: gRPC with Typescript and Go',
        urlTitle: 'grpc-with-typescript-and-go-part-1',
        type: PostType.Tutorial,
    },
    {
        humanTitle: 'Part 2 - Building a webapp for pod logs: gRPC with Typescript and Go',
        urlTitle: 'grpc-with-typescript-and-go-part-2',
        type: PostType.Tutorial,
    },
    {
        humanTitle: 'Part 3 - Building a webapp for pod logs: gRPC with Typescript and Go',
        urlTitle: 'grpc-with-typescript-and-go-part-3',
        type: PostType.Tutorial,
    },
    /*{ // TODO - revisit with streaming, caching etc
        humanTitle: 'Part 4 - Building a webapp for pod logs: gRPC with Typescript and Go',
        urlTitle: 'grpc-with-typescript-and-go-part-4',
        type: PostType.Tutorial,
    },*/
    {
        humanTitle: 'Building a wristwatch [ BANDWIDTH WARNING - lots of gifs ]',
        urlTitle: 'building-a-wristwatch',
        type: PostType.Tutorial,
    },
    {
        humanTitle: 'A year of DevOps: Musings from a software developer',
        urlTitle: 'what-i-learned-from-a-year-of-devops',
        type: PostType.Opinion,
    }
];

export function loadPostMeta(): Array<PostMeta> {
    return postMetas.slice();
}

export function loadPostFromLocation(location: string): Promise<Post> {
    return new Promise((resolve, reject) => {
        let postType = Object.keys(PostType).find((p: string) => location.indexOf(PostType[p]) > 0);
        if (!postType) {
            return reject(`Cant find a PostType (${Object.keys(PostType)}) in ${location}`);
        }

        let postTypeString = PostType[postType];

        let urlTitle = location.split(postTypeString + '/').pop();
        let postMeta = loadPostMeta().find((p: PostMeta) => p.urlTitle === urlTitle);
        if (postMeta === undefined) {
            return reject('Post not found');
        }

        fetch(`/raw/${postTypeString}/${postMeta!!.urlTitle}.md`)
            .then((res) => res.text())
            .then((text: string) => {
                return resolve({...postMeta, text: text} as Post);
            })
            .catch((reason) => reject(reason));
    });
}
