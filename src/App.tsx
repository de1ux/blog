import createMuiTheme from '@material-ui/core/styles/createMuiTheme';
import MuiThemeProvider from '@material-ui/core/styles/MuiThemeProvider';
import * as React from 'react';
import { Route, Switch } from 'react-router';
import { BrowserRouter } from 'react-router-dom';
import { Article } from './Article';
import { withFooter } from './Footer';
import { Home } from './Home';
import { withNavbar } from './Navbar';

const theme = createMuiTheme({
    shadows: Array(25).fill('none') as any,
});

export class App extends React.PureComponent {
    render() {
        return <MuiThemeProvider theme={theme}>
            <BrowserRouter>
                <Switch>
                    <Route path="/tutorials" component={withNavbar(Article)}/>
                    <Route path="/opinions" component={withNavbar(Article)}/>
                    <Route path="/" component={withNavbar(withFooter(Home))}/>
                </Switch>
            </BrowserRouter>
        </MuiThemeProvider>;

    }
}
