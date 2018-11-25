import { Card, CardContent, Collapse, List, ListItem, ListItemAvatar, ListItemText } from '@material-ui/core';
import ListItemIcon from '@material-ui/core/ListItemIcon';
import FolderIcon from '@material-ui/icons/Folder';
import FolderOpenIcon from '@material-ui/icons/FolderOpen';
import SubjectIcon from '@material-ui/icons/Subject';
import * as React from 'react';
import { Link } from 'react-router-dom';

interface HomeState {
    tutorialsOpen: boolean;
    opinionsOpen: boolean;
}

export class Home extends React.Component<{}, HomeState> {
    public readonly state: HomeState = {
        tutorialsOpen: true,
        opinionsOpen: true,
    };

    toggleTutorials = () => this.setState({tutorialsOpen: !this.state.tutorialsOpen});
    toggleOpinions = () => this.setState({opinionsOpen: !this.state.opinionsOpen});

    render() {
        return <Card>
            <CardContent style={{fontFamily: 'Montserrat', fontSize: '16px'}}>
                <List>
                    <ListItem button onClick={this.toggleTutorials}>
                        <ListItemAvatar>
                            {this.state.tutorialsOpen ? <FolderOpenIcon/> : <FolderIcon/>}
                        </ListItemAvatar>
                        <ListItemText>
                            tutorials
                        </ListItemText>
                    </ListItem>
                    <Collapse in={this.state.tutorialsOpen}>
                        <List>
                            <Link to={'articles/grpc-with-typescript-and-go.md'} style={{textDecoration: 'none'}}>
                                <ListItem button style={{marginLeft: '20px'}}>
                                    <ListItemIcon>
                                        <SubjectIcon/>
                                    </ListItemIcon>
                                    <ListItemText inset>
                                        Building a webapp for pod logs: gRPC with Typescript and Go
                                    </ListItemText>
                                </ListItem>
                            </Link>
                            <Link to={'articles/kubernetes-go-creating-updating-rolling-back.md'} style={{textDecoration: 'none'}}>
                                <ListItem button style={{marginLeft: '20px'}}>
                                    <ListItemIcon>
                                        <SubjectIcon/>
                                    </ListItemIcon>
                                    <ListItemText inset>
                                        Kubernetes client-go: Updating and rolling back a deployment
                                    </ListItemText>
                                </ListItem>
                            </Link>
                        </List>
                    </Collapse>
                    <ListItem button onClick={this.toggleOpinions}>
                        <ListItemAvatar>
                            {this.state.opinionsOpen ? <FolderOpenIcon/> : <FolderIcon/>}
                        </ListItemAvatar>
                        <ListItemText>
                            opinions
                        </ListItemText>
                    </ListItem>
                    <Collapse in={this.state.opinionsOpen}>
                        <List>
                            <Link to={'opinions/what-i-learned-from-a-year-of-devops.md'} style={{textDecoration: 'none'}}>
                                <ListItem button style={{marginLeft: '20px'}}>
                                    <ListItemIcon>
                                        <SubjectIcon/>
                                    </ListItemIcon>
                                    <ListItemText inset>
                                        What I learned from a year of DevOps
                                    </ListItemText>
                                </ListItem>
                            </Link>
                        </List>
                    </Collapse>
                </List>
            </CardContent>
        </Card>;
    }
}
