import { createMuiTheme, MuiThemeProvider } from '@material-ui/core';
import { Shadows } from '@material-ui/core/styles/shadows';
import * as React from 'react';
import { Route, Switch } from 'react-router';
import { BrowserRouter } from 'react-router-dom';
import { Article } from './Article';
import { withFooter } from './Footer';
import { Home } from './Home';
import { withNavbar } from './Navbar';

const theme = createMuiTheme({
    shadows: Array(25).fill('none') as Shadows,
});

interface AppProps {
}

export class App extends React.PureComponent<AppProps> {
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
