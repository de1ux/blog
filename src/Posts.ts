enum PostType {
    Opinion,
    Tutorial,
}

export interface Post {
    humanTitle: string;
    src: string;
    type: PostType;
    text?: string;
}

export function loadPostFromLocation(location: string): Promise<Post> {
    return new Promise((resolve, reject) => {
        let isArticle = location.indexOf('articles/') > 0;
        let isOpinion = location.indexOf('opinions/') > 0;
        if (!isArticle && !isOpinion) {
            return reject('Not article or opinion');
        }
        let prefix = isOpinion ? 'opinions/' : 'articles/';
        let resource = location.split(prefix).pop();

        let post = posts.find((p: Post) => {
            return p.src === resource;
        });

        if (post === undefined) {
            return reject( 'Post not found');
        }

        return fetch(`/raw/${prefix}${post.src}`).then((res) => res.text().then((text) => {
            post!!.text = text;
            resolve(post);
        }));
    });

}

export const posts: Array<Post> = [
    {
        humanTitle: 'Kubernetes client-go: Updating and rolling back a deployment',
        src: 'kubernetes-go-creating-updating-rolling-back.md',
        type: PostType.Tutorial,
    },
    {
        humanTitle: 'Building a webapp for pod logs: gRPC with Typescript and Go',
        src: 'grpc-with-typescript-and-go.md',
        type: PostType.Tutorial,
    },
    {
        humanTitle: 'What I learned from a year of DevOps',
        src: 'what-i-learned-from-a-year-of-devops.md',
        type: PostType.Opinion,
    }
];

