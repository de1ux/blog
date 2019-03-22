
import Card from '@material-ui/core/Card/Card';
import CardHeader from '@material-ui/core/CardHeader/CardHeader';
import Grid from '@material-ui/core/Grid/Grid';
import * as React from 'react';
import { Link } from 'react-router-dom';

export const withNavbar = <P extends object>(Component: React.ComponentType<P>) => {
    class navbarHOC extends React.Component<P> {
        render() {
            return <div>
                <Grid container alignItems={'center'} justify={'center'} spacing={24}>
                    <Grid xs={12}>
                        <Link style={{textDecoration: 'none'}} to={'/'}>
                            <Card>
                                <CardHeader style={{fontFamily: 'Montserrat', textAlign: 'center'}} title={'de1ux'} subheader={
                                    <span>Learning how to blog in <s>2018</s> 2019</span>
                                }/>
                            </Card>
                        </Link>
                    </Grid>
                    <Grid xs={12}>
                        <Component {...this.props} />
                    </Grid>
                </Grid>
            </div>;
        }
    }

    return navbarHOC;
};
