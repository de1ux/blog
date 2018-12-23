import { Card, CardContent, Collapse, List, ListItem, ListItemAvatar, ListItemText } from '@material-ui/core';
import ListItemIcon from '@material-ui/core/ListItemIcon';
import FolderIcon from '@material-ui/icons/Folder';
import FolderOpenIcon from '@material-ui/icons/FolderOpen';
import SubjectIcon from '@material-ui/icons/Subject';
import * as React from 'react';
import { Link } from 'react-router-dom';
import { loadPostMeta, PostMeta, PostType } from './Posts';

export class Home extends React.Component<{}, {}> {
    private metaByType: Map<string, Array<PostMeta>>;

    constructor(props: {}) {
        super(props);
        this.metaByType = new Map<string, Array<PostMeta>>();
        this.state = {};

        for (let m of loadPostMeta()) {
            if (!this.metaByType[m.type]) {
                this.metaByType[m.type] = [];
                this.state[m.type] = true;
            }
            this.metaByType[m.type].push(m);
        }
    }

    toggleCollapse = (key: string) => () =>
        this.setState({[key]: !this.state[key]});


    renderFolder(meta: Array<PostMeta>, type: PostType) {
        return <div key={`folder-${type}`}>
            <ListItem button onClick={this.toggleCollapse(type)}>
                <ListItemAvatar>
                    {this.state[type] ? <FolderOpenIcon/> : <FolderIcon/>}
                </ListItemAvatar>
                <ListItemText>
                    {type}
                </ListItemText>
            </ListItem>
            <Collapse in={this.state[type]}>
                <List>
                    {meta.map(m => this.renderItem(m))}
                </List>
            </Collapse>
        </div>;
    }

    renderItem(meta: PostMeta) {
        return <Link key={`item-${meta.urlTitle}`} to={`${meta.type}/${meta.urlTitle}`} style={{textDecoration: 'none'}}>
            <ListItem button style={{marginLeft: '20px'}}>
                <ListItemIcon>
                    <SubjectIcon/>
                </ListItemIcon>
                <ListItemText inset>
                    {meta.humanTitle}
                </ListItemText>
            </ListItem>
        </Link>;
    }

    render() {
        return <Card>
            <CardContent style={{fontFamily: 'Montserrat', fontSize: '16px'}}>
                <List>
                    {Object.keys(this.metaByType).map(key =>
                         this.renderFolder(this.metaByType[key], key as PostType)
                    )}
                </List>
            </CardContent>
        </Card>;
    }
}
