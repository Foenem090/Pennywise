import React from 'react';
import Hero from '../components/hero';
import Featured from '../components/featured';
import Earn from '../components/earn';
import Contact from '../components/Contact';

const Home = ({ onNotify }) => {
  return (
    <>
      <Hero onNotify={onNotify} />
      <Featured />
      <Earn onNotify={onNotify} />
      <Contact onNotify={onNotify} />
    </>
  );
};

export default Home;
