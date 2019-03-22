import * as React from 'react';
import { Route, Switch } from 'react-router';
import { BrowserRouter } from 'react-router-dom';
import { Article } from './Article';
import { withFooter } from './Footer';
import { Home } from './Home';
import { withNavbar } from './Navbar';

export class App extends React.PureComponent {
    render() {
        return <BrowserRouter>
            <Switch>
                <Route path="/tutorials" component={withNavbar(Article)}/>
                <Route path="/opinions" component={withNavbar(Article)}/>
                <Route path="/" component={withNavbar(withFooter(Home))}/>
            </Switch>
        </BrowserRouter>;

    }
}
